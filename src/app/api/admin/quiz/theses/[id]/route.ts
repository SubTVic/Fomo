// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: update and delete a quiz thesis

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  textEn: z.string().max(500).optional().nullable(),
  shortTitle: z.string().min(1).max(50).optional(),
  hint: z.string().max(200).optional().nullable(),
  hintEn: z.string().max(200).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  attributes: z.array(z.object({
    attribute: z.string().min(1),
    isInverse: z.boolean().default(false),
  })).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.quizThesis.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { attributes, ...data } = parsed.data;

  const thesis = await db.quizThesis.update({
    where: { id },
    data: {
      ...data,
      ...(attributes !== undefined
        ? {
            attributes: {
              deleteMany: {},
              create: attributes.map((a) => ({
                attribute: a.attribute,
                isInverse: a.isInverse,
              })),
            },
          }
        : {}),
    },
    include: { attributes: true },
  });

  return NextResponse.json({ ok: true, thesis });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.quizThesis.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.quizThesis.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
