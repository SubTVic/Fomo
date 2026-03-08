// SPDX-License-Identifier: AGPL-3.0-only
// API: save pilot survey session to DB

import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";
import { z } from "zod";
import { db } from "@/lib/db";

const VALID_ANSWER_VALUES = new Set(["0", "1", "3", "5"]);

const variantEnum = z.enum(["scroll", "classic", "swipe", "chat"]);

const SubmitSchema = z.object({
  // Multi-variant flow sends variantOrder array; legacy sends variant string
  variant: variantEnum.optional(),
  variantOrder: z.array(variantEnum).length(4).optional(),
  preferredVariant: variantEnum.optional(),
  preferenceReason: z.string().max(2000).optional(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  demographic: z.object({
    semester: z.string().nullable(),
    isMember: z.string().nullable(),
    groupNames: z.string().max(500).nullable(),
  }),
  feedback: z.object({
    confusing: z.string().max(5000),
    missing: z.string().max(5000),
  }),
  durationMs: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers);
  if (isRateLimited(`pilot:${clientKey}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { variant, variantOrder, preferredVariant, preferenceReason, answers, demographic, feedback } = parsed.data;

  // Validate question IDs against DB
  const validQuestions = await db.pilotSurveyQuestion.findMany({ select: { id: true } });
  const validQuestionIds = new Set(validQuestions.map((q) => q.id));

  const invalidIds: string[] = [];
  const invalidValues: string[] = [];
  for (const [questionId, value] of Object.entries(answers)) {
    if (!validQuestionIds.has(questionId)) {
      invalidIds.push(questionId);
    }
    const v = Array.isArray(value) ? value : [value];
    for (const val of v) {
      if (!VALID_ANSWER_VALUES.has(val)) {
        invalidValues.push(`${questionId}=${val}`);
      }
    }
  }
  if (invalidIds.length > 0 || invalidValues.length > 0) {
    return NextResponse.json(
      { error: "Invalid answers", invalidIds, invalidValues },
      { status: 422 }
    );
  }

  // Multi-variant flow stores "mixed" as variant, single-variant stores the key
  const variantValue = variantOrder ? "mixed" : (variant ?? "scroll");

  try {
    const session = await db.pilotSession.create({
      data: {
        variant: variantValue,
        variantOrder: variantOrder ? JSON.stringify(variantOrder) : null,
        preferredVariant: preferredVariant ?? null,
        preferenceReason: preferenceReason || null,
        completedAt: new Date(),
        semester: demographic.semester,
        isMember: demographic.isMember,
        groupNames: demographic.groupNames,
        feedbackConfusing: feedback.confusing || null,
        feedbackMissing: feedback.missing || null,
        answers: {
          create: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: Array.isArray(value) ? value.join(",") : value,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (err) {
    console.error("Failed to save pilot session:", err);
    return NextResponse.json(
      { error: "Speichern fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
