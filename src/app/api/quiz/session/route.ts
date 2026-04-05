// SPDX-License-Identifier: AGPL-3.0-only
// API: Record anonymous quiz session for analytics

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

const SessionSchema = z.object({
  answers: z.record(z.string(), z.string()).optional(),
  topMatches: z
    .array(z.object({ groupId: z.string(), score: z.number() }))
    .max(10)
    .optional(),
  questionCount: z.number().int().min(0).max(100),
  resultCount: z.number().int().min(0).max(200),
  deviceType: z.enum(["mobile", "desktop"]).optional(),
  abortedAtQ: z.number().int().min(1).max(100).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers);
  if (isRateLimited(`quiz-session:${clientKey}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { answers, topMatches, questionCount, resultCount, deviceType, abortedAtQ } =
    parsed.data;

  // Get current semester from SiteConfig (fallback to empty string)
  let semester: string | null = null;
  try {
    const config = await db.siteConfig.findUnique({
      where: { key: "current_semester" },
    });
    semester = config?.value ?? null;
  } catch {
    // SiteConfig may not exist yet — that's fine
  }

  const session = await db.quizSession.create({
    data: {
      semester,
      questionCount,
      resultCount,
      answers: answers ?? undefined,
      topMatches: topMatches ?? undefined,
      deviceType: deviceType ?? null,
      abortedAtQ: abortedAtQ ?? null,
      completedAt: abortedAtQ ? null : new Date(),
    },
  });

  return NextResponse.json({ ok: true, sessionId: session.id }, { status: 201 });
}
