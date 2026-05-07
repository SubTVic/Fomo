// SPDX-License-Identifier: AGPL-3.0-only
// Merge a self-registered duplicate group (source=id) into an existing group (target).
// Transfers selfRating + contact fields, then deletes the source.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const MergeSchema = z.object({
  targetGroupId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sourceId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = MergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "targetGroupId required" }, { status: 422 });
  }

  const { targetGroupId } = parsed.data;

  if (sourceId === targetGroupId) {
    return NextResponse.json({ error: "source und target sind identisch" }, { status: 400 });
  }

  const [source, target] = await Promise.all([
    db.group.findUnique({
      where: { id: sourceId },
      include: { selfRating: { include: { answers: true } } },
    }),
    db.group.findUnique({ where: { id: targetGroupId } }),
  ]);

  if (!source) return NextResponse.json({ error: "Source-Gruppe nicht gefunden" }, { status: 404 });
  if (!target) return NextResponse.json({ error: "Target-Gruppe nicht gefunden" }, { status: 404 });

  // Transfer selfRating to target (upsert — target may already have one)
  if (source.selfRating) {
    const { raterCount, filterSelections, answers } = source.selfRating;
    await db.groupSelfRating.upsert({
      where: { groupId: targetGroupId },
      create: {
        groupId: targetGroupId,
        token: "merged",
        raterCount,
        filterSelections: filterSelections ?? [],
        answers: { create: answers.map(({ itemId, value }) => ({ itemId, value })) },
      },
      update: {
        token: "merged",
        submittedAt: new Date(),
        raterCount,
        filterSelections: filterSelections ?? [],
        answers: {
          deleteMany: {},
          create: answers.map(({ itemId, value }) => ({ itemId, value })),
        },
      },
    });
  }

  // Transfer contact/description fields from source to target where target has no value
  const contactUpdate: Record<string, string> = {};
  if (!target.contactEmail && source.contactEmail) contactUpdate.contactEmail = source.contactEmail;
  if (!target.contactPerson && source.contactPerson) contactUpdate.contactPerson = source.contactPerson;
  if (!target.contactPersonRole && source.contactPersonRole) contactUpdate.contactPersonRole = source.contactPersonRole;
  if (!target.websiteUrl && source.websiteUrl) contactUpdate.websiteUrl = source.websiteUrl;
  if (!target.instagramUrl && source.instagramUrl) contactUpdate.instagramUrl = source.instagramUrl;
  if (!target.longDescription && source.longDescription) contactUpdate.longDescription = source.longDescription;

  if (Object.keys(contactUpdate).length > 0) {
    await db.group.update({ where: { id: targetGroupId }, data: contactUpdate });
  }

  // Delete source (cascades invites, pilot answers, study2 sessions, selfRating)
  await db.group.delete({ where: { id: sourceId } });

  return NextResponse.json({ success: true, targetGroupId });
}
