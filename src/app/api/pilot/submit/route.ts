// SPDX-License-Identifier: AGPL-3.0-only
// API: save pilot survey session to DB

import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";
import { z } from "zod";
import { db } from "@/lib/db";

const variantEnum = z.enum(["scroll", "classic", "swipe", "chat"]);

const SubmitSchema = z.object({
  // Multi-variant flow sends variantOrder array; legacy sends variant string
  variant: variantEnum.optional(),
  variantOrder: z.array(variantEnum).length(4).optional(),
  preferredVariant: variantEnum.optional(),
  preferenceReason: z.string().optional(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  demographic: z.object({
    semester: z.string().nullable(),
    isMember: z.string().nullable(),
    groupNames: z.string().nullable(),
  }),
  feedback: z.object({
    confusing: z.string(),
    missing: z.string(),
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

  // Multi-variant flow stores "mixed" as variant, single-variant stores the key
  const variantValue = variantOrder ? "mixed" : (variant ?? "scroll");

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
}
