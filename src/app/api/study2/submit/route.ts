// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";

const submitSchema = z.object({
  groupId: z.string().min(1).nullable(),
  groupNameFreeText: z.string().max(200).nullable(),
  filterSelections: z.array(z.string()).max(8),
  semester: z.enum(["1", "2", "3", "4", "5", "6+"]).nullable(),
  studyField: z.string().max(100).nullable(),
  feedbackConfusing: z.string().max(2000).nullable(),
  feedbackMissing: z.string().max(2000).nullable(),
  answers: z
    .array(
      z.object({
        itemId: z.string().regex(/^WS2-\d{2}$/),
        value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
      }),
    )
    .min(1)
    .max(25),
});

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request.headers);
  if (isRateLimited(`study2:submit:${clientKey}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (!data.groupId && !data.groupNameFreeText) {
    return NextResponse.json(
      { error: "groupId oder groupNameFreeText muss gesetzt sein" },
      { status: 400 },
    );
  }

  const session = await db.$transaction(async (tx) => {
    const created = await tx.study2Session.create({
      data: {
        groupId: data.groupId,
        groupNameFreeText: data.groupNameFreeText,
        filterSelections: data.filterSelections,
        semester: data.semester,
        studyField: data.studyField,
        isMember: "yes",
        feedbackConfusing: data.feedbackConfusing,
        feedbackMissing: data.feedbackMissing,
        completedAt: new Date(),
      },
    });

    await tx.study2Answer.createMany({
      data: data.answers.map((a) => ({
        sessionId: created.id,
        itemId: a.itemId,
        value: a.value,
      })),
    });

    return created;
  });

  return NextResponse.json({ sessionId: session.id });
}
