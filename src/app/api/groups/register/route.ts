// SPDX-License-Identifier: AGPL-3.0-only
// API: register a Hochschulgruppe via the group survey form

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  // Stammdaten
  name: z.string().min(2).max(100),
  categoryName: z.string().min(1),
  shortDescription: z.string().min(10).max(200),
  longDescription: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(2030).optional(),
  motto: z.string().max(150).optional(),

  // Kontakt
  contactEmail: z.string().email(),
  contactPerson: z.string().max(100).optional(),
  contactPersonRole: z.string().max(100).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().max(200).optional(),

  // Struktur
  memberCount: z.string().optional(), // e.g. "1-10", "11-25", "26-50", "51-100", "100+"
  meetingSchedule: z.string().max(200).optional(),
  language: z.enum(["german", "both", "english"]).optional(),
  onboardingInfo: z.string().max(2000).optional(),

  // Quiz-Profil
  answers: z.record(z.string(), z.string()),

  // Einverständnis
  dataConsent: z.literal("ja"),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 2;
  while (await db.group.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers);
  if (isRateLimited(`register:${clientKey}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es in einer Stunde erneut." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const {
    name,
    categoryName,
    shortDescription,
    longDescription,
    foundedYear,
    motto,
    contactEmail,
    contactPerson,
    contactPersonRole,
    websiteUrl,
    instagramUrl,
    memberCount,
    meetingSchedule,
    language,
    onboardingInfo,
    answers,
  } = parsed.data;

  try {
    // Find or create category
    let category = await db.category.findFirst({ where: { name: categoryName } });
    if (!category) {
      category = await db.category.create({
        data: { name: categoryName, order: 99 },
      });
    }

    const slug = await uniqueSlug(generateSlug(name));

    const group = await db.group.create({
      data: {
        name,
        slug,
        shortDescription,
        longDescription: longDescription || null,
        foundedYear: foundedYear || null,
        motto: motto || null,
        categoryId: category.id,
        contactEmail,
        contactPerson: contactPerson || null,
        contactPersonRole: contactPersonRole || null,
        websiteUrl: websiteUrl || null,
        instagramUrl: instagramUrl || null,
        memberCount: memberCount ? parseInt(memberCount.split("-")[0]) : null,
        meetingSchedule: meetingSchedule || null,
        language: language || null,
        onboardingInfo: onboardingInfo || null,
        registeredVia: "survey",
        registeredAt: new Date(),
        isActive: true,
        isVerified: false,
        pilotAnswers: {
          create: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, groupId: group.id, slug: group.slug });
  } catch {
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
