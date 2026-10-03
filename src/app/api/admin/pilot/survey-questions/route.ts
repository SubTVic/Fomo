// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  id: z.string().min(1).max(20),
  dimensionId: z.string().min(1).nullable().default(null),
  text: z.string().min(1).max(1000),
  order: z.number().int().min(0).default(0),
  isInverse: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.dimensionId) {
    const dimension = await db.pilotDimension.findUnique({ where: { id: parsed.data.dimensionId } });
    if (!dimension) {
      return NextResponse.json({ error: "Dimension nicht gefunden" }, { status: 404 });
    }
  }

  const existing = await db.pilotSurveyQuestion.findUnique({ where: { id: parsed.data.id } });
  if (existing) {
    return NextResponse.json({ error: "Frage mit dieser ID existiert bereits" }, { status: 409 });
  }

  const question = await db.pilotSurveyQuestion.create({ data: parsed.data });
  return NextResponse.json(question, { status: 201 });
}
