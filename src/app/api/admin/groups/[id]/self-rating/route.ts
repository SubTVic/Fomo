// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: edit a group's self-rating (21 answers, activity filters, rater
// count). Every change is recorded in the change log.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { recordChange, snapshotGroup } from "@/lib/change-log";
import { WS2_FILTER, WS2_ITEMS } from "@/lib/ws2-items";

const ITEM_IDS = new Set(WS2_ITEMS.map((i) => i.id));
const FILTER_ATTRS = new Set(WS2_FILTER.options.map((o) => o.attribute));

const schema = z.object({
  raterCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  filterSelections: z.array(z.string().refine((f) => FILTER_ATTRS.has(f))).max(8),
  answers: z
    .array(
      z.object({
        itemId: z.string().refine((id) => ITEM_IDS.has(id)),
        value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
      }),
    )
    .length(WS2_ITEMS.length)
    .refine((a) => new Set(a.map((x) => x.itemId)).size === a.length, "duplicate itemId"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { raterCount, filterSelections, answers } = parsed.data;

  const group = await db.group.findUnique({ where: { id }, select: { id: true } });
  if (!group) {
    return NextResponse.json({ error: "Gruppe nicht gefunden." }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    const before = await snapshotGroup(tx, id);
    await tx.groupSelfRating.upsert({
      where: { groupId: id },
      create: {
        groupId: id,
        token: "admin",
        raterCount,
        filterSelections,
        answers: { create: answers },
      },
      update: {
        raterCount,
        filterSelections,
        answers: { deleteMany: {}, create: answers },
      },
    });
    const after = await snapshotGroup(tx, id);
    if (before && after) {
      await recordChange(tx, {
        groupId: id,
        source: "admin",
        before,
        after,
        reviewedByEmail: guard.admin.email,
      });
    }
  });

  return NextResponse.json({ ok: true });
}
