// SPDX-License-Identifier: AGPL-3.0-only

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label ist erforderlich"),
  value: z.string().min(1, "Wert ist erforderlich"),
  order: z.number().int().min(0),
});

const updateQuestionSchema = z
  .object({
    text: z.string().min(1, "Fragetext ist erforderlich"),
    type: z.enum(["LIKERT", "SINGLE_CHOICE", "MULTI_CHOICE", "YES_NO", "SLIDER"]),
    order: z.number().int().min(0).default(0),
    isRequired: z.boolean().default(true),
    helpText: z.string().nullable().optional(),
    categoryTag: z.string().nullable().optional(),
    weight: z.number().min(0).default(1.0),
    sliderMin: z.number().int().nullable().optional(),
    sliderMax: z.number().int().nullable().optional(),
    sliderStep: z.number().int().nullable().optional(),
    sliderMinLabel: z.string().nullable().optional(),
    sliderMaxLabel: z.string().nullable().optional(),
    options: z.array(optionSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "SINGLE_CHOICE" || data.type === "MULTI_CHOICE") {
        return data.options && data.options.length >= 2;
      }
      return true;
    },
    { message: "Auswahlfragen brauchen mindestens 2 Optionen", path: ["options"] },
  );

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = updateQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { options, ...questionData } = parsed.data;

  // Update question and handle options in a transaction
  const question = await db.$transaction(async (tx) => {
    // Update the question fields
    await tx.question.update({
      where: { id },
      data: {
        ...questionData,
        helpText: questionData.helpText ?? null,
        categoryTag: questionData.categoryTag ?? null,
        sliderMin: questionData.sliderMin ?? null,
        sliderMax: questionData.sliderMax ?? null,
        sliderStep: questionData.sliderStep ?? null,
        sliderMinLabel: questionData.sliderMinLabel ?? null,
        sliderMaxLabel: questionData.sliderMaxLabel ?? null,
      },
    });

    // Handle options for SINGLE_CHOICE / MULTI_CHOICE
    if (questionData.type === "SINGLE_CHOICE" || questionData.type === "MULTI_CHOICE") {
      const incomingOptions = options ?? [];

      // Get existing option IDs
      const existingOptions = await tx.questionOption.findMany({
        where: { questionId: id },
        select: { id: true },
      });
      const existingIds = new Set(existingOptions.map((o) => o.id));

      // Determine which options to create, update, or delete
      const incomingIds = new Set(incomingOptions.filter((o) => o.id).map((o) => o.id!));
      const toDelete = [...existingIds].filter((eid) => !incomingIds.has(eid));

      // Delete removed options
      if (toDelete.length > 0) {
        await tx.questionOption.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Upsert each option
      for (const opt of incomingOptions) {
        if (opt.id && existingIds.has(opt.id)) {
          await tx.questionOption.update({
            where: { id: opt.id },
            data: { label: opt.label, value: opt.value, order: opt.order },
          });
        } else {
          await tx.questionOption.create({
            data: {
              questionId: id,
              label: opt.label,
              value: opt.value,
              order: opt.order,
            },
          });
        }
      }
    } else {
      // For non-choice types, remove any leftover options
      await tx.questionOption.deleteMany({ where: { questionId: id } });
    }

    return tx.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(question);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden" }, { status: 404 });
  }

  await db.question.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
