// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  emoji: z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  blockIndex: z.number().int().min(0).max(3).optional(),
  order: z.number().int().min(0).optional(),
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

  const existing = await db.pilotDimension.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Dimension nicht gefunden" }, { status: 404 });
  }

  const updated = await db.pilotDimension.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const existing = await db.pilotDimension.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } });
  if (!existing) {
    return NextResponse.json({ error: "Dimension nicht gefunden" }, { status: 404 });
  }

  await db.pilotDimension.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
