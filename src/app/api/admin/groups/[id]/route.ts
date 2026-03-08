// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: update group (PUT) and toggle active (PATCH)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  shortDescription: z.string().min(1).max(200),
  longDescription: z.string().nullable().optional(),
  categoryId: z.string().cuid(),
  contactEmail: z.string().email().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  instagramUrl: z.string().url().nullable().optional(),

  // Details
  memberCount: z.number().int().positive().nullable().optional(),
  meetingSchedule: z.string().nullable().optional(),
  motto: z.string().nullable().optional(),
  foundedYear: z.number().int().min(1800).max(2100).nullable().optional(),

  // Boolean matching attributes
  career: z.boolean(),
  tech: z.boolean(),
  socialImpact: z.boolean(),
  party: z.boolean(),
  religion: z.boolean(),
  sports: z.boolean(),
  networking: z.boolean(),
  arts: z.boolean(),
  music: z.boolean(),
  timeLow: z.boolean(),
  handsOn: z.boolean(),
  outdoor: z.boolean(),
  international: z.boolean(),
  beginnerFriendly: z.boolean(),
  competitive: z.boolean(),
  financialCost: z.boolean(),
  leadershipOpportunities: z.boolean(),

  // Categorical attributes
  language: z.enum(["german", "both", "english"]).nullable().optional(),
  eventFrequency: z.enum(["low", "medium", "high"]).nullable().optional(),
  groupSize: z.enum(["small", "medium", "large"]).nullable().optional(),
});

// PUT: full update of editable fields
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await db.group.findUnique({ where: { id } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check slug uniqueness (excluding the current group)
  if (parsed.data.slug !== group.slug) {
    const existing = await db.group.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Slug is already in use" },
        { status: 409 }
      );
    }
  }

  const updated = await db.group.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true, group: updated });
}

// PATCH: toggle isActive
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await db.group.findUnique({ where: { id } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const updated = await db.group.update({
    where: { id },
    data: { isActive: !group.isActive },
  });

  return NextResponse.json({ ok: true, isActive: updated.isActive });
}
