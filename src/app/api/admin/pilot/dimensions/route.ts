// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  id: z.string().min(1).max(10).regex(/^D\d+$/, "ID must be like D1, D2, ..."),
  label: z.string().min(1).max(200),
  emoji: z.string().max(10).default(""),
  description: z.string().max(500).default(""),
  blockIndex: z.number().int().min(0).max(3).default(0),
  order: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await db.pilotDimension.findUnique({ where: { id: parsed.data.id } });
  if (existing) {
    return NextResponse.json({ error: "Dimension mit dieser ID existiert bereits" }, { status: 409 });
  }

  const dimension = await db.pilotDimension.create({ data: parsed.data });
  return NextResponse.json(dimension, { status: 201 });
}
