// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: bulk-import quiz theses from JSON

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const thesisSchema = z.object({
  text: z.string().min(1).max(500),
  shortTitle: z.string().min(1).max(50),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  attributes: z
    .array(
      z.object({
        attribute: z.string().min(1),
        isInverse: z.boolean().default(false),
      }),
    )
    .default([]),
});

const importSchema = z.object({
  theses: z.array(thesisSchema).min(1).max(200),
  // "append": add to existing | "replace": delete all first
  mode: z.enum(["append", "replace"]).default("append"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { theses, mode } = parsed.data;

  if (mode === "replace") {
    await db.quizThesis.deleteMany({});
  }

  const created = await db.$transaction(
    theses.map((t, i) =>
      db.quizThesis.create({
        data: {
          text: t.text,
          shortTitle: t.shortTitle,
          order: t.order ?? i,
          isActive: t.isActive ?? true,
          attributes: {
            create: t.attributes.map((a) => ({
              attribute: a.attribute,
              isInverse: a.isInverse,
            })),
          },
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, imported: created.length }, { status: 201 });
}
