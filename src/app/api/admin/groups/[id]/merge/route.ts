// SPDX-License-Identifier: AGPL-3.0-only
// Merge a self-registered duplicate group (source=id) into an existing group (target).
// Transfers selfRating, content fields, category, contacts and edit links,
// then deletes the source. Logged in the target's change log.
// keepSourceData=true: source's content overwrites target (use when source has the better data).
// keepSourceData=false (default): only fill in missing fields on target.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin";
import { recordChange, snapshotGroup } from "@/lib/change-log";

const MergeSchema = z.object({
  targetGroupId: z.string().min(1),
  keepSourceData: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Merging deletes data of the source group: super admins only.
  const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
  if (!guard.ok) return guard.response;

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

  const { targetGroupId, keepSourceData } = parsed.data;

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
  async function transferSelfRating(tx: Prisma.TransactionClient) {
    if (!source?.selfRating) return;
    const { raterCount, filterSelections, answers } = source.selfRating;
    await tx.groupSelfRating.upsert({
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

  // Transfer content fields from source to target.
  // keepSourceData=true: overwrite target with source values (source has the better data).
  // keepSourceData=false: only fill in fields that are missing on target.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = source as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tgt = target as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentUpdate: Record<string, any> = {};
  const transfer = (field: string) => {
    const sv = src[field];
    const tv = tgt[field];
    if (keepSourceData) {
      if (sv !== null && sv !== undefined && sv !== "") contentUpdate[field] = sv;
    } else {
      if ((tv === null || tv === undefined || tv === "") && sv !== null && sv !== undefined && sv !== "") {
        contentUpdate[field] = sv;
      }
    }
  };

  // Content fields
  // Note: slug is NOT transferred — it's @unique and would collide with source's slug
  // before deletion. The target's existing slug stays for URL stability.
  if (keepSourceData) {
    transfer("name");
    transfer("shortDescription");
  }
  transfer("longDescription");
  transfer("contactEmail");
  transfer("contactPerson");
  transfer("contactPersonRole");
  transfer("websiteUrl");
  transfer("instagramUrl");
  // Link and its name belong together: move the name only with the link.
  transfer("communityLinkUrl");
  if ("communityLinkUrl" in contentUpdate) contentUpdate.communityLinkLabel = src.communityLinkLabel ?? null;
  transfer("logoUrl");
  transfer("memberCount");
  transfer("meetingSchedule");
  transfer("motto");
  transfer("foundedYear");
  transfer("language");
  transfer("eventFrequency");
  transfer("groupSize");
  transfer("categoryId");

  // Boolean attributes — only overwrite when keepSourceData
  if (keepSourceData) {
    for (const attr of [
      "career", "tech", "socialImpact", "party", "religion", "sports",
      "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
      "international", "beginnerFriendly", "competitive", "financialCost",
      "leadershipOpportunities",
    ]) {
      contentUpdate[attr] = src[attr];
    }
  }

  // Always preserve submission state from source on target — the merged group
  // still needs admin verification, so it must stay visible in the "Eingereicht"
  // tab. Force isVerified=false for the same reason.
  if (src.registrationStatus) contentUpdate.registrationStatus = src.registrationStatus;
  if (src.registeredVia) contentUpdate.registeredVia = src.registeredVia;
  if (src.registeredAt) contentUpdate.registeredAt = src.registeredAt;
  contentUpdate.isVerified = false;

  try {
    await db.$transaction(async (tx) => {
      const before = await snapshotGroup(tx, targetGroupId);
      await transferSelfRating(tx);
      if (Object.keys(contentUpdate).length > 0) {
        await tx.group.update({ where: { id: targetGroupId }, data: contentUpdate });
      }
      // Keep the people and the group's edit links: move them instead of
      // letting the cascade delete them with the source.
      await tx.groupContact.updateMany({ where: { groupId: sourceId }, data: { groupId: targetGroupId } });
      await tx.groupEditToken.updateMany({ where: { groupId: sourceId }, data: { groupId: targetGroupId } });

      // Delete source (cascades invites, pilot answers, study2 sessions, selfRating)
      await tx.group.delete({ where: { id: sourceId } });

      const after = await snapshotGroup(tx, targetGroupId);
      if (before && after) {
        await recordChange(tx, {
          groupId: targetGroupId,
          source: "admin",
          before,
          after,
          reviewedByEmail: guard.admin.email,
        });
      }
    });

    return NextResponse.json({ success: true, targetGroupId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler beim Zusammenführen";
    console.error("[merge] failed", { sourceId, targetGroupId, keepSourceData, err });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
