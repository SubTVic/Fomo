// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;

  const existing = await db.pilotSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Answers are deleted via cascade (onDelete: Cascade in schema)
  await db.pilotSession.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
