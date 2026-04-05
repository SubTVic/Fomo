// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: list and create quiz theses

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

const createSchema = z.object({
  text: z.string().min(1).max(500),
  shortTitle: z.string().min(1).max(50),
  order: z.number().int().min(0).default(0),
  attributes: z.array(attributeSchema).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const theses = await db.quizThesis.findMany({
    include: { attributes: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ theses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { text, shortTitle, order, attributes } = parsed.data;

  const thesis = await db.quizThesis.create({
    data: {
      text,
      shortTitle,
      order,
      attributes: {
        create: attributes.map((a) => ({
          attribute: a.attribute,
          isInverse: a.isInverse,
        })),
      },
    },
    include: { attributes: true },
  });

  revalidatePath("/quiz");
  return NextResponse.json({ ok: true, thesis }, { status: 201 });
}
