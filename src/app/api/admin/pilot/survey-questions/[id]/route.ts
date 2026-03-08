// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  order: z.number().int().min(0).optional(),
  isInverse: z.boolean().optional(),
  dimensionId: z.string().min(1).nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await db.pilotSurveyQuestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden" }, { status: 404 });
  }

  const updated = await db.pilotSurveyQuestion.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const existing = await db.pilotSurveyQuestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden" }, { status: 404 });
  }

  await db.pilotSurveyQuestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
