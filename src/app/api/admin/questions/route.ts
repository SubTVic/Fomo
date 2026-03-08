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

const createQuestionSchema = z
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = createQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { options, ...questionData } = parsed.data;

  const question = await db.question.create({
    data: {
      ...questionData,
      helpText: questionData.helpText ?? null,
      categoryTag: questionData.categoryTag ?? null,
      sliderMin: questionData.sliderMin ?? null,
      sliderMax: questionData.sliderMax ?? null,
      sliderStep: questionData.sliderStep ?? null,
      sliderMinLabel: questionData.sliderMinLabel ?? null,
      sliderMaxLabel: questionData.sliderMaxLabel ?? null,
      options:
        options && options.length > 0
          ? {
              create: options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                order: opt.order,
              })),
            }
          : undefined,
    },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(question, { status: 201 });
}
