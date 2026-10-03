// SPDX-License-Identifier: AGPL-3.0-only
// Reusable, revocable edit links per group (Umsetzungsplan WP-4.2).
//
// A link carries a random token; the database only stores sha256(token).
// Tokens are valid for 12 months and can be used any number of times until
// they expire or an admin revokes them. Legacy one-time GroupInvite links keep
// working during the transition (resolveEditLink checks both).

import crypto from "node:crypto";
import type { GroupInvite, Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const EDIT_TOKEN_VALIDITY_MONTHS = 12;

/** Path of the edit page (prefix with the app origin). */
export const EDIT_LINK_PATH = "/gruppe/bearbeiten";

export function hashEditToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateEditToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashEditToken(token) };
}

export function editTokenExpiry(from: Date = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setMonth(expiresAt.getMonth() + EDIT_TOKEN_VALIDITY_MONTHS);
  return expiresAt;
}

export function editLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}${EDIT_LINK_PATH}?token=${encodeURIComponent(token)}`;
}

export type EditLinkProblem = "invalid" | "expired" | "revoked" | "used";

/** Pure validity check for a stored edit token. */
export function editTokenProblem(
  record: { expiresAt: Date; revokedAt: Date | null },
  now: Date = new Date(),
): EditLinkProblem | null {
  if (record.revokedAt) return "revoked";
  if (record.expiresAt < now) return "expired";
  return null;
}

/** Create a new edit token for a group; optionally revoke all others first. */
export async function createEditToken(
  db: Db,
  groupId: string,
  opts: { revokeOthers?: boolean } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const now = new Date();
  if (opts.revokeOthers) {
    await revokeEditTokens(db, groupId, now);
  }
  const { token, tokenHash } = generateEditToken();
  const expiresAt = editTokenExpiry(now);
  await db.groupEditToken.create({ data: { groupId, tokenHash, expiresAt } });
  return { token, expiresAt };
}

/** Revoke every active edit token (and unused legacy invite) of a group. */
export async function revokeEditTokens(db: Db, groupId: string, now: Date = new Date()) {
  const tokens = await db.groupEditToken.updateMany({
    where: { groupId, revokedAt: null },
    data: { revokedAt: now },
  });
  // Legacy invites have no revoke flag; expiring them has the same effect.
  const invites = await db.groupInvite.updateMany({
    where: { groupId, usedAt: null, expiresAt: { gt: now } },
    data: { expiresAt: now },
  });
  return tokens.count + invites.count;
}

export type ResolvedEditLink =
  | { ok: true; kind: "edit-token"; groupId: string; tokenId: string }
  | { ok: true; kind: "invite"; groupId: string; invite: GroupInvite }
  | { ok: false; problem: EditLinkProblem };

/**
 * Look up a token from a link: first as a reusable edit token (by hash), then
 * as a legacy one-time invite. Does not mark anything as used.
 */
export async function resolveEditLink(db: Db, token: string): Promise<ResolvedEditLink> {
  const now = new Date();
  const editToken = await db.groupEditToken.findUnique({
    where: { tokenHash: hashEditToken(token) },
  });
  if (editToken) {
    const problem = editTokenProblem(editToken, now);
    return problem
      ? { ok: false, problem }
      : { ok: true, kind: "edit-token", groupId: editToken.groupId, tokenId: editToken.id };
  }

  const invite = await db.groupInvite.findUnique({ where: { token } });
  if (!invite) return { ok: false, problem: "invalid" };
  if (invite.expiresAt < now) return { ok: false, problem: "expired" };
  if (invite.usedAt) return { ok: false, problem: "used" };
  return { ok: true, kind: "invite", groupId: invite.groupId, invite };
}

const CONTACT = "fomo@yeti-dresden.org";

/** User-facing message (German) and HTTP status for a link problem. */
export function editLinkError(problem: EditLinkProblem): { error: string; status: number } {
  switch (problem) {
    case "invalid":
      return { error: `Dieser Bearbeitungslink ist ungültig. Bitte schreibt an ${CONTACT} – wir schicken euch einen neuen Link.`, status: 404 };
    case "expired":
      return { error: `Dieser Bearbeitungslink ist abgelaufen. Bitte schreibt an ${CONTACT} – wir schicken euch einen neuen Link.`, status: 410 };
    case "revoked":
      return { error: `Dieser Bearbeitungslink wurde zurückgezogen. Bitte schreibt an ${CONTACT} – wir schicken euch einen neuen Link.`, status: 410 };
    case "used":
      return { error: `Dieser Einladungslink wurde bereits verwendet. Bitte schreibt an ${CONTACT} – wir schicken euch einen dauerhaften Bearbeitungslink.`, status: 409 };
  }
}
