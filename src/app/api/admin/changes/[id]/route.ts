// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: mark a change log entry as seen, or revert it.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";
import {
  applySnapshotValues,
  planRevert,
  recordChange,
  snapshotGroup,
  type Changes,
} from "@/lib/change-log";

const bodySchema = z.object({ action: z.enum(["review", "revert"]) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const entry = await db.groupChangeLog.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  const reviewed = { reviewedAt: new Date(), reviewedByEmail: guard.admin.email };

  if (parsed.data.action === "review") {
    await db.groupChangeLog.update({ where: { id }, data: reviewed });
    return NextResponse.json({ ok: true });
  }

  const result = await db.$transaction(async (tx) => {
    const before = await snapshotGroup(tx, entry.groupId);
    if (!before) return null;
    const { values, skipped } = planRevert(entry.changes as Changes, before);
    await applySnapshotValues(tx, entry.groupId, values);
    const after = await snapshotGroup(tx, entry.groupId);
    if (after) {
      await recordChange(tx, {
        groupId: entry.groupId,
        source: "revert",
        before,
        after,
        reviewedByEmail: guard.admin.email,
      });
    }
    await tx.groupChangeLog.update({ where: { id }, data: reviewed });
    return { reverted: Object.keys(values), skipped };
  });

  if (!result) {
    return NextResponse.json({ error: "Gruppe nicht gefunden." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...result });
}
