// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const QuestionSchema = z.object({
  id: z.string().min(1).max(20),
  dimensionId: z.string().min(1),
  text: z.string().min(1),
  order: z.number().int().min(0).default(0),
  isInverse: z.boolean().default(false),
});

const StandaloneQuestionSchema = z.object({
  id: z.string().min(1).max(20),
  text: z.string().min(1),
  order: z.number().int().min(0).default(0),
  isInverse: z.boolean().default(false),
});

const DimensionSchema = z.object({
  id: z.string().min(1).max(10).regex(/^D\d+$/, "ID must be like D1, D2, ..."),
  label: z.string().min(1).max(200),
  emoji: z.string().max(10).default(""),
  description: z.string().max(500).default(""),
  blockIndex: z.number().int().min(0).max(3).default(0),
  order: z.number().int().min(0).default(0),
  questions: z.array(QuestionSchema).default([]),
});

const ImportSchema = z.object({
  dimensions: z.array(DimensionSchema).min(1),
  standaloneQuestions: z.array(StandaloneQuestionSchema).default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültiges Format", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Validate that all question dimensionIds match their parent dimension
  for (const dim of parsed.data.dimensions) {
    const mismatch = dim.questions.find((q) => q.dimensionId !== dim.id);
    if (mismatch) {
      return NextResponse.json(
        { error: `Frage ${mismatch.id} hat dimensionId "${mismatch.dimensionId}", erwartet "${dim.id}"` },
        { status: 422 },
      );
    }
  }

  // Replace all dimensions and questions in a transaction
  await db.$transaction(async (tx) => {
    await tx.pilotSurveyQuestion.deleteMany();
    await tx.pilotDimension.deleteMany();

    for (const dim of parsed.data.dimensions) {
      await tx.pilotDimension.create({
        data: {
          id: dim.id,
          label: dim.label,
          emoji: dim.emoji,
          description: dim.description,
          blockIndex: dim.blockIndex,
          order: dim.order,
          questions: {
            create: dim.questions.map((q) => ({
              id: q.id,
              text: q.text,
              order: q.order,
              isInverse: q.isInverse,
            })),
          },
        },
      });
    }

    // Create standalone questions (no dimension)
    for (const q of parsed.data.standaloneQuestions) {
      await tx.pilotSurveyQuestion.create({
        data: {
          id: q.id,
          text: q.text,
          order: q.order,
          isInverse: q.isInverse,
          dimensionId: null,
        },
      });
    }
  });

  const totalQuestions = parsed.data.dimensions.reduce((s, d) => s + d.questions.length, 0)
    + parsed.data.standaloneQuestions.length;

  return NextResponse.json({
    ok: true,
    dimensions: parsed.data.dimensions.length,
    standaloneQuestions: parsed.data.standaloneQuestions.length,
    totalQuestions,
  });
}
