// SPDX-License-Identifier: AGPL-3.0-only
// API: Load and submit a group's profile via edit link (no login needed)

import { NextRequest, NextResponse } from "next/server";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { isHttpUrl, normalizeInstagramUrl, normalizeWebsiteUrl } from "@/lib/normalize-url";
import { recordChange, snapshotGroup } from "@/lib/change-log";
import { communityLinkData, communityLinkLabelSchema, communityLinkUrlSchema } from "@/lib/community-link";
import { editLinkError, resolveEditLink } from "@/lib/edit-token";

const SubmitSchema = z.object({
  token: z.string().min(1),
  shortDescription: z.string().min(10).max(200).optional(),
  // Optional fields: undefined = keep, null or "" = delete.
  longDescription: z.string().trim().max(3000).nullable().optional(),
  websiteUrl: z.preprocess(normalizeWebsiteUrl, z.string().max(500).refine(isHttpUrl).nullable().optional().or(z.literal(""))),
  contactEmail: z.string().trim().email().nullable().optional().or(z.literal("")),
  instagramUrl: z.preprocess(normalizeInstagramUrl, z.string().max(200).refine(isHttpUrl).nullable().optional().or(z.literal(""))),
  communityLinkUrl: communityLinkUrlSchema,
  communityLinkLabel: communityLinkLabelSchema,
  memberCount: z.number().int().min(1).max(10000).nullable().optional(),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  categoryId: z.string().cuid().optional(),
  // v2: WS2-Self-Rating
  ws2Answers: z.array(z.object({
    itemId: z.string().regex(/^WS2-\d{2}$/),
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  })).min(1).max(25).optional(),
  ws2FilterSelections: z.array(z.string()).max(8).optional(),
  raterCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { token, shortDescription, longDescription, websiteUrl, contactEmail, instagramUrl, communityLinkUrl, communityLinkLabel, memberCount, foundedYear, categoryId, ws2Answers, ws2FilterSelections, raterCount } = parsed.data;

  // undefined = field not sent (keep), null or "" = delete, otherwise set.
  const optional = <T,>(key: string, value: T | null | undefined | "") =>
    value === undefined ? {} : { [key]: value === "" ? null : value };

  // Validate the token: reusable edit link, or legacy one-time invite.
  const link = await resolveEditLink(db, token);
  if (!link.ok) {
    const { error, status } = editLinkError(link.problem);
    return NextResponse.json({ error }, { status });
  }
  const group = await db.group.findUnique({
    where: { id: link.groupId },
    select: { isVerified: true },
  });
  if (!group) {
    const { error, status } = editLinkError("invalid");
    return NextResponse.json({ error }, { status });
  }

  const now = new Date();

  if (link.kind === "invite") {
    // Legacy one-time invite: claim atomically — updateMany with usedAt: null
    // ensures only one concurrent request can succeed (second gets count=0 → 409).
    const claimed = await db.groupInvite.updateMany({
      where: { id: link.invite.id, usedAt: null },
      data: { usedAt: now },
    });
    if (claimed.count === 0) {
      const { error, status } = editLinkError("used");
      return NextResponse.json({ error }, { status });
    }
  }
  // Reusable edit links store no plaintext token anywhere, not even here.
  const ratingToken = link.kind === "invite" ? token : `edit-token:${link.tokenId}`;

  // Decision E1 (Umsetzungsplan §2): corrections by an already verified group
  // go live without a new review. The group stays verified; admins see the
  // diff under "Änderungen" and can revert it. Unverified groups still need
  // an admin to verify them.
  const wasVerified = group.isVerified;
  const groupId = link.groupId;

  await db.$transaction(async (tx) => {
    if (link.kind === "edit-token") {
      await tx.groupEditToken.update({ where: { id: link.tokenId }, data: { lastUsedAt: now } });
    }
    const before = await snapshotGroup(tx, groupId);

    await tx.group.update({
      where: { id: groupId },
      data: {
        ...(wasVerified ? {} : { registrationStatus: RegistrationStatus.SUBMITTED, isVerified: false }),
        submittedAt: now,
        ...(shortDescription ? { shortDescription } : {}),
        ...optional("longDescription", longDescription),
        ...optional("websiteUrl", websiteUrl),
        ...optional("contactEmail", contactEmail),
        ...optional("instagramUrl", instagramUrl),
        ...communityLinkData(communityLinkUrl, communityLinkLabel),
        ...optional("memberCount", memberCount),
        ...optional("foundedYear", foundedYear),
        ...(categoryId ? { categoryId } : {}),
      },
    });

    if (ws2Answers && ws2Answers.length > 0) {
      await tx.groupSelfRating.upsert({
        where: { groupId },
        create: {
          groupId,
          token: ratingToken,
          raterCount: raterCount ?? 1,
          filterSelections: ws2FilterSelections ?? [],
          answers: {
            create: ws2Answers.map(({ itemId, value }) => ({ itemId, value })),
          },
        },
        update: {
          token: ratingToken,
          submittedAt: now,
          raterCount: raterCount ?? 1,
          filterSelections: ws2FilterSelections ?? [],
          answers: {
            deleteMany: {},
            create: ws2Answers.map(({ itemId, value }) => ({ itemId, value })),
          },
        },
      });
    }

    const after = await snapshotGroup(tx, groupId);
    if (before && after) {
      await recordChange(tx, { groupId, source: "edit-link", before, after });
    }
  });

  // live: the group stays verified, so the change needs no admin review.
  return NextResponse.json({ success: true, live: wasVerified });
}

// GET: Validate token and return group data (for pre-filling the form)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const link = await resolveEditLink(db, token);
  if (!link.ok) {
    const { error, status } = editLinkError(link.problem);
    return NextResponse.json({ error }, { status });
  }

  const group = await db.group.findUnique({
    where: { id: link.groupId },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      longDescription: true,
      websiteUrl: true,
      contactEmail: true,
      instagramUrl: true,
      communityLinkUrl: true,
      communityLinkLabel: true,
      memberCount: true,
      foundedYear: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      registrationStatus: true,
      // V2 self-rating for pre-filling
      selfRating: {
        select: {
          raterCount: true,
          filterSelections: true,
          answers: { select: { itemId: true, value: true } },
        },
      },
    },
  });
  if (!group) {
    const { error, status } = editLinkError("invalid");
    return NextResponse.json({ error }, { status });
  }

  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return NextResponse.json({
    group,
    categories,
    email: link.kind === "invite" ? link.invite.email : null,
    reusable: link.kind === "edit-token",
  });
}
