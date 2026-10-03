// SPDX-License-Identifier: AGPL-3.0-only
// API: Submit confirmed attributes via invite token (no login needed)

import { NextRequest, NextResponse } from "next/server";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { isHttpUrl, normalizeInstagramUrl, normalizeWebsiteUrl } from "@/lib/normalize-url";
import { recordChange, snapshotGroup } from "@/lib/change-log";
import { editLinkError, resolveEditLink } from "@/lib/edit-token";

const ATTRIBUTE_KEYS = [
  "career", "tech", "language", "social_impact", "party", "religion",
  "sports", "networking", "arts", "music", "time_low", "hands_on",
  "outdoor", "international", "beginner_friendly", "competitive",
  "event_frequency", "leadership_opportunities", "group_size",
] as const;

const SubmitSchema = z.object({
  token: z.string().min(1),
  // legacy (optional, beibehalten für Rückwärtskompatibilität)
  confirmedAttributes: z.record(z.enum(ATTRIBUTE_KEYS), z.union([z.literal(0), z.literal(1)])).optional(),
  shortDescription: z.string().min(10).max(200).optional(),
  websiteUrl: z.preprocess(normalizeWebsiteUrl, z.string().max(500).refine(isHttpUrl).optional().or(z.literal(""))),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  instagramUrl: z.preprocess(normalizeInstagramUrl, z.string().max(200).refine(isHttpUrl).optional().or(z.literal(""))),
  memberCount: z.number().int().min(1).max(10000).optional(),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
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

  const { token, confirmedAttributes, shortDescription, websiteUrl, contactEmail, instagramUrl, memberCount, foundedYear, categoryId, ws2Answers, ws2FilterSelections, raterCount } = parsed.data;

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

  // Map confirmed attributes to the boolean columns on Group
  const booleanUpdates: Record<string, boolean> = {};
  const attrToPrismaField: Record<string, string> = {
    career: "career",
    tech: "tech",
    language: "language",
    social_impact: "socialImpact",
    party: "party",
    religion: "religion",
    sports: "sports",
    networking: "networking",
    arts: "arts",
    music: "music",
    time_low: "timeLow",
    hands_on: "handsOn",
    outdoor: "outdoor",
    international: "international",
    beginner_friendly: "beginnerFriendly",
    competitive: "competitive",
    event_frequency: "eventFrequency",
    leadership_opportunities: "leadershipOpportunities",
    group_size: "groupSize",
  };

  const booleanAttrs = [
    "career", "tech", "social_impact", "party", "religion", "sports",
    "networking", "arts", "music", "time_low", "hands_on", "outdoor",
    "international", "beginner_friendly", "competitive", "leadership_opportunities",
  ];

  if (confirmedAttributes) {
    for (const attr of booleanAttrs) {
      const prismaField = attrToPrismaField[attr];
      if (prismaField && confirmedAttributes[attr as keyof typeof confirmedAttributes] !== undefined) {
        booleanUpdates[prismaField] = confirmedAttributes[attr as keyof typeof confirmedAttributes] === 1;
      }
    }
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
        ...booleanUpdates,
        ...(confirmedAttributes ? { confirmedAttributes: JSON.parse(JSON.stringify(confirmedAttributes)) } : {}),
        ...(wasVerified ? {} : { registrationStatus: RegistrationStatus.SUBMITTED, isVerified: false }),
        submittedAt: now,
        ...(shortDescription ? { shortDescription } : {}),
        ...(websiteUrl ? { websiteUrl } : {}),
        ...(contactEmail ? { contactEmail } : {}),
        ...(instagramUrl ? { instagramUrl } : {}),
        ...(memberCount !== undefined ? { memberCount } : {}),
        ...(foundedYear !== undefined ? { foundedYear } : {}),
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

  return NextResponse.json({ success: true });
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
      websiteUrl: true,
      contactEmail: true,
      instagramUrl: true,
      memberCount: true,
      foundedYear: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      scraperAttributes: true,
      confirmedAttributes: true,
      registrationStatus: true,
      // All boolean attributes for current state
      career: true, tech: true, socialImpact: true, party: true,
      religion: true, sports: true, networking: true, arts: true,
      music: true, timeLow: true, handsOn: true, outdoor: true,
      international: true, beginnerFriendly: true, competitive: true,
      leadershipOpportunities: true, financialCost: true,
      language: true, eventFrequency: true, groupSize: true,
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
