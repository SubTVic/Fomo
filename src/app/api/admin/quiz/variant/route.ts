// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: get/set the active quiz variant

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const variantSchema = z.object({
  variant: z.enum(["classic", "scroll", "swipe", "chat"]),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid variant" }, { status: 422 });
  }

  await db.siteConfig.upsert({
    where: { key: "quiz_variant" },
    update: { value: parsed.data.variant },
    create: { key: "quiz_variant", value: parsed.data.variant },
  });

  return NextResponse.json({ ok: true, variant: parsed.data.variant });
}
