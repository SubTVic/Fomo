// SPDX-License-Identifier: AGPL-3.0-only
// Records anonymous quiz sessions for usage analytics (no personal data).

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const SessionSchema = z.object({
  startedAt: z.number().int().positive(),
  completedAt: z.number().int().positive(),
  questionCount: z.number().int().min(0).max(100),
  resultCount: z.number().int().min(0).max(200),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { startedAt, completedAt, questionCount, resultCount } = parsed.data;

  await db.quizSession.create({
    data: {
      startedAt: new Date(startedAt),
      completedAt: new Date(completedAt),
      questionCount,
      resultCount,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
