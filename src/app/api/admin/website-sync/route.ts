// SPDX-License-Identifier: AGPL-3.0-only
// Admin API "Abgleich mit Website": GET lists the differences between the live
// website data and the database; POST takes over selected website values for
// ONE group. Values are recomputed on the server (the client only names the
// fields), written in one transaction and recorded in the change log.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin";
import { applySnapshotValues, recordChange, snapshotGroup, type Snapshot } from "@/lib/change-log";
import { loadWebsiteComparison } from "@/lib/website-sync-load";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  try {
    return NextResponse.json(await loadWebsiteComparison());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

const schema = z.object({
  groupId: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const { groupId, keys } = parsed.data;

  let comparison;
  try {
    comparison = await loadWebsiteComparison();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  const group = comparison.groups.find((g) => g.groupId === groupId);
  const wanted = new Set(keys);
  const diffs = group?.diffs.filter((d) => wanted.has(d.key)) ?? [];
  if (diffs.length === 0) {
    return NextResponse.json({ error: "Keine passenden Abweichungen (inzwischen schon gleich?)" }, { status: 409 });
  }
  const values: Snapshot = Object.fromEntries(diffs.map((d) => [d.key, d.apply]));

  try {
    await db.$transaction(async (tx) => {
      const before = await snapshotGroup(tx, groupId);
      if (!before) throw new Error("Gruppe nicht gefunden");
      await applySnapshotValues(tx, groupId, values);
      const after = await snapshotGroup(tx, groupId);
      if (after) {
        await recordChange(tx, {
          groupId,
          source: "website-sync",
          before,
          after,
          reviewedByEmail: guard.admin.email,
        });
      }
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, applied: diffs.map((d) => d.key) });
}
