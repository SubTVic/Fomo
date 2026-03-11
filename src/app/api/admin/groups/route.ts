// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: create a new group

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1).max(200),
  shortDescription: z.string().min(1).max(200),
  categoryId: z.string().cuid(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { name, shortDescription, categoryId, contactEmail, websiteUrl } = parsed.data;

  // Generate unique slug
  let slug = slugify(name);
  const existing = await db.group.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const group = await db.group.create({
    data: {
      name,
      slug,
      shortDescription,
      categoryId,
      contactEmail: contactEmail || null,
      websiteUrl: websiteUrl || null,
      registeredVia: "admin",
      registeredAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, group }, { status: 201 });
}
