// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: update and delete a quiz thesis

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { ALL_ATTRIBUTE_KEYS } from "@/lib/quiz/attribute-labels";

const attributeSchema = z.object({
  attribute: z.enum(ALL_ATTRIBUTE_KEYS as [string, ...string[]]),
  isInverse: z.boolean().default(false),
});

const updateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  shortTitle: z.string().min(1).max(50).optional(),
  hint: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  attributes: z.array(attributeSchema).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.quizThesis.findUnique({
    where: { id },
    include: { attributes: true },
  });
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

  // Create a version snapshot of the current state before updating
  let semesterTag = "unknown";
  try {
    const config = await db.siteConfig.findUnique({ where: { key: "current_semester" } });
    if (config?.value) semesterTag = config.value;
  } catch { /* SiteConfig may not exist */ }

  await db.quizThesisVersion.create({
    data: {
      thesisId: existing.id,
      text: existing.text,
      hint: existing.hint,
      attributeMappings: existing.attributes.map((a) => ({
        attribute: a.attribute,
        isInverse: a.isInverse,
      })),
      semesterTag,
      validFrom: existing.updatedAt,
      validUntil: new Date(),
    },
  });

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

  revalidatePath("/quiz");
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

  revalidatePath("/quiz");
  return NextResponse.json({ ok: true });
}
