// SPDX-License-Identifier: AGPL-3.0-only
// API: Submit confirmed attributes via invite token (no login needed)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

const ATTRIBUTE_KEYS = [
  "career", "tech", "language", "social_impact", "party", "religion",
  "sports", "networking", "arts", "music", "time_low", "hands_on",
  "outdoor", "international", "beginner_friendly", "competitive",
  "event_frequency", "leadership_opportunities", "financial_cost", "group_size",
] as const;

const SubmitSchema = z.object({
  token: z.string().min(1),
  confirmedAttributes: z.record(z.enum(ATTRIBUTE_KEYS), z.union([z.literal(0), z.literal(1)])),
  shortDescription: z.string().min(10).max(200).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers);
  if (isRateLimited(`register-attrs:${clientKey}`, 10, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte kurz." }, { status: 429 });
  }

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

  const { token, confirmedAttributes, shortDescription, websiteUrl } = parsed.data;

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
    language: "language", // This is actually a string field, handle below
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
    event_frequency: "eventFrequency", // String field, handle below
    leadership_opportunities: "leadershipOpportunities",
    financial_cost: "financialCost",
    group_size: "groupSize", // String field, handle below
  };

  // Boolean attributes (all 17 matching attributes)
  const booleanAttrs = [
    "career", "tech", "social_impact", "party", "religion", "sports",
    "networking", "arts", "music", "time_low", "hands_on", "outdoor",
    "international", "beginner_friendly", "competitive",
    "leadership_opportunities", "financial_cost",
  ];

  // Categorical attribute mapping (stored as strings, not booleans)
  const categoricalUpdates: Record<string, string | null> = {};
  const categoricalMapping: Record<string, { prismaField: string; trueVal: string; falseVal: string | null }> = {
    language: { prismaField: "language", trueVal: "both", falseVal: "german" },
    event_frequency: { prismaField: "eventFrequency", trueVal: "high", falseVal: "low" },
    group_size: { prismaField: "groupSize", trueVal: "large", falseVal: "small" },
  };

  for (const [attr, mapping] of Object.entries(categoricalMapping)) {
    const val = confirmedAttributes[attr as keyof typeof confirmedAttributes];
    if (val !== undefined) {
      categoricalUpdates[mapping.prismaField] = val === 1 ? mapping.trueVal : mapping.falseVal;
    }
  }

  for (const attr of booleanAttrs) {
    const prismaField = attrToPrismaField[attr];
    if (prismaField && confirmedAttributes[attr as keyof typeof confirmedAttributes] !== undefined) {
      booleanUpdates[prismaField] = confirmedAttributes[attr as keyof typeof confirmedAttributes] === 1;
    }
  }

  const now = new Date();

  // Atomically claim the token AND update group in a single transaction.
  // Prevents partial state where invite is claimed but attributes not saved.
  try {
    await db.$transaction(async (tx) => {
      // M2 fix: updateMany with usedAt: null ensures only one concurrent
      // request can succeed (second gets count=0 → abort).
      const claimed = await tx.groupInvite.updateMany({
        where: { id: invite.id, usedAt: null },
        data: { usedAt: now },
      });

      if (claimed.count === 0) {
        throw new Error("ALREADY_CLAIMED");
      }

      await tx.group.update({
        where: { id: invite.groupId },
        data: {
          ...booleanUpdates,
          ...categoricalUpdates,
          confirmedAttributes: confirmedAttributes,
          registrationStatus: RegistrationStatus.SUBMITTED,
          submittedAt: now,
          isVerified: false,
          ...(shortDescription ? { shortDescription } : {}),
          ...(websiteUrl ? { websiteUrl } : {}),
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "Dieser Einladungslink wurde bereits verwendet." },
        { status: 409 },
      );
    }
    throw err;
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
