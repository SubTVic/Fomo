// SPDX-License-Identifier: AGPL-3.0-only
// Bulk delete pilot sessions

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  // Answers are deleted via cascade (onDelete: Cascade in schema)
  const result = await db.pilotSession.deleteMany({
    where: { id: { in: parsed.data.ids } },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
