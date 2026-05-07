// SPDX-License-Identifier: AGPL-3.0-only
// API: Submit confirmed attributes via invite token (no login needed)

import { NextRequest, NextResponse } from "next/server";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

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
  websiteUrl: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  memberCount: z.number().int().min(1).max(10000).optional(),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
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

  const { token, confirmedAttributes, shortDescription, websiteUrl, contactEmail, instagramUrl, memberCount, foundedYear, ws2Answers, ws2FilterSelections, raterCount } = parsed.data;

  // Validate the token
  const invite = await db.groupInvite.findUnique({
    where: { token },
    include: { group: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Ungültiger Einladungslink." }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Dieser Einladungslink ist abgelaufen. Bitte kontaktiert das FOMO-Team." },
      { status: 410 },
    );
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

  // Atomically claim the token — updateMany with usedAt: null ensures
  // only one concurrent request can succeed (second gets count=0 → 409).
  const claimed = await db.groupInvite.updateMany({
    where: { id: invite.id, usedAt: null },
    data: { usedAt: now },
  });

  if (claimed.count === 0) {
    return NextResponse.json(
      { error: "Dieser Einladungslink wurde bereits verwendet." },
      { status: 409 },
    );
  }

  await db.group.update({
    where: { id: invite.groupId },
    data: {
      ...booleanUpdates,
      ...(confirmedAttributes ? { confirmedAttributes: JSON.parse(JSON.stringify(confirmedAttributes)) } : {}),
      registrationStatus: RegistrationStatus.SUBMITTED,
      submittedAt: now,
      isVerified: false,
      ...(shortDescription ? { shortDescription } : {}),
      ...(websiteUrl ? { websiteUrl } : {}),
      ...(contactEmail ? { contactEmail } : {}),
      ...(instagramUrl ? { instagramUrl } : {}),
      ...(memberCount !== undefined ? { memberCount } : {}),
      ...(foundedYear !== undefined ? { foundedYear } : {}),
    },
  });

  if (ws2Answers && ws2Answers.length > 0) {
    await db.groupSelfRating.upsert({
      where: { groupId: invite.groupId },
      create: {
        groupId: invite.groupId,
        token,
        raterCount: raterCount ?? 1,
        filterSelections: ws2FilterSelections ?? [],
        answers: {
          create: ws2Answers.map(({ itemId, value }) => ({ itemId, value })),
        },
      },
      update: {
        token,
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

  return NextResponse.json({ success: true });
}

// GET: Validate token and return group data (for pre-filling the form)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const invite = await db.groupInvite.findUnique({
    where: { token },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          shortDescription: true,
          websiteUrl: true,
          contactEmail: true,
          instagramUrl: true,
          memberCount: true,
          foundedYear: true,
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
            include: { answers: true },
          },
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Ungültiger Einladungslink." }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Dieser Einladungslink ist abgelaufen." },
      { status: 410 },
    );
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "Dieser Einladungslink wurde bereits verwendet." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    group: invite.group,
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
  });
}
