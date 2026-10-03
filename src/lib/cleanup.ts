// SPDX-License-Identifier: AGPL-3.0-only
// Deletion of data that is no longer needed (Löschkonzept, WP-5.5):
// expired or revoked edit links, used or expired legacy invites and old
// failed-login records. Run via scripts/cleanup.ts (later as a cron job on
// the server). Retention periods: docs/datenschutz-loeschkonzept.md.

import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dead links are kept this long after they stopped working, so a group that
 * opens an old link still gets "expired"/"revoked" instead of "invalid".
 */
export const DEAD_LINK_GRACE_DAYS = 30;
/** Failed logins only matter for the 15-minute lock (src/lib/login-guard.ts). */
export const LOGIN_ATTEMPT_KEEP_DAYS = 1;

export interface CleanupCounts {
  editTokens: number;
  invites: number;
  loginAttempts: number;
}

/** The where-clauses of one cleanup run (exported for tests and dry runs). */
export function cleanupFilters(now: Date) {
  const linkCutoff = new Date(now.getTime() - DEAD_LINK_GRACE_DAYS * DAY_MS);
  const loginCutoff = new Date(now.getTime() - LOGIN_ATTEMPT_KEEP_DAYS * DAY_MS);
  return {
    editTokens: {
      OR: [{ revokedAt: { lt: linkCutoff } }, { expiresAt: { lt: linkCutoff } }],
    } satisfies Prisma.GroupEditTokenWhereInput,
    invites: {
      OR: [{ usedAt: { lt: linkCutoff } }, { expiresAt: { lt: linkCutoff } }],
    } satisfies Prisma.GroupInviteWhereInput,
    loginAttempts: {
      createdAt: { lt: loginCutoff },
    } satisfies Prisma.LoginAttemptWhereInput,
  };
}

/** Count what a cleanup run would delete, without deleting anything. */
export async function countExpiredData(db: Db, now = new Date()): Promise<CleanupCounts> {
  const where = cleanupFilters(now);
  const [editTokens, invites, loginAttempts] = await Promise.all([
    db.groupEditToken.count({ where: where.editTokens }),
    db.groupInvite.count({ where: where.invites }),
    db.loginAttempt.count({ where: where.loginAttempts }),
  ]);
  return { editTokens, invites, loginAttempts };
}

/** Delete expired data; returns how many rows were removed per table. */
export async function deleteExpiredData(db: PrismaClient, now = new Date()): Promise<CleanupCounts> {
  const where = cleanupFilters(now);
  const [editTokens, invites, loginAttempts] = await db.$transaction([
    db.groupEditToken.deleteMany({ where: where.editTokens }),
    db.groupInvite.deleteMany({ where: where.invites }),
    db.loginAttempt.deleteMany({ where: where.loginAttempts }),
  ]);
  return {
    editTokens: editTokens.count,
    invites: invites.count,
    loginAttempts: loginAttempts.count,
  };
}
