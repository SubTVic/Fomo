// SPDX-License-Identifier: AGPL-3.0-only
// API: register a Hochschulgruppe via the group survey form

import { NextRequest, NextResponse } from "next/server";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function jaccardSimilarity(a: string, b: string): number {
  const ba = bigrams(a);
  const bb = bigrams(b);
  if (ba.size === 0 && bb.size === 0) return 1;
  let intersection = 0;
  for (const bg of ba) if (bb.has(bg)) intersection++;
  return intersection / (ba.size + bb.size - intersection);
}

// Returns the best-matching existing group ID if similarity > 0.55, else null
async function findDuplicateGroup(name: string, excludeId: string): Promise<string | null> {
  const normalized = normalizeName(name);
  const existing = await db.group.findMany({
    where: { id: { not: excludeId }, registeredVia: { not: "survey" } },
    select: { id: true, name: true },
  });
  let bestId: string | null = null;
  let bestScore = 0.55; // threshold
  for (const g of existing) {
    const score = jaccardSimilarity(normalized, normalizeName(g.name));
    if (score > bestScore) {
      bestScore = score;
      bestId = g.id;
    }
  }
  return bestId;
}

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
  websiteUrl: z.string().max(500).optional(),
  instagramUrl: z.string().max(200).optional(),

  // Struktur
  memberCount: z.string().optional(),
  meetingSchedule: z.string().max(200).optional(),
  language: z.enum(["german", "both", "english"]).optional(),
  onboardingInfo: z.string().max(2000).optional(),

  // WS2-Profil
  ws2Answers: z.array(z.object({
    itemId: z.string().regex(/^WS2-\d{2}$/),
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  })).min(1).max(25).optional(),
  ws2FilterSelections: z.array(z.string()).max(8).optional(),
  raterCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),

  // Verantwortliche Person
  responsibleName: z.string().min(2).max(100),
  responsibleEmail: z.string().email(),
  responsibleRole: z.string().max(100).optional(),
  responsibleConfirmed: z.literal(true),

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
    ws2Answers,
    ws2FilterSelections,
    raterCount,
    responsibleName,
    responsibleEmail,
    responsibleRole,
  } = parsed.data;

  try {
    const category = await db.category.findFirst({ where: { name: categoryName } });
    if (!category) {
      return NextResponse.json(
        { error: `Unbekannte Kategorie: ${categoryName}` },
        { status: 422 }
      );
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
        registrationStatus: RegistrationStatus.SUBMITTED,
        submittedAt: new Date(),
        isActive: false,   // admin must activate after review
        isVerified: false,
      },
    });

    // Check for duplicate existing group (fire after creation to have excludeId)
    const duplicateId = await findDuplicateGroup(name, group.id);
    if (duplicateId) {
      await db.group.update({
        where: { id: group.id },
        data: { duplicateOfGroupId: duplicateId },
      });
    }

    // Save responsible contact person to the contact list
    await db.groupContact.create({
      data: {
        groupId: group.id,
        name: responsibleName,
        email: responsibleEmail,
        role: responsibleRole || null,
        isResponsible: true,
        source: "self-registration",
      },
    });

    // Save WS2 self-rating if provided
    if (ws2Answers && ws2Answers.length > 0) {
      await db.groupSelfRating.create({
        data: {
          groupId: group.id,
          token: "self-register",
          raterCount: raterCount ?? 1,
          filterSelections: ws2FilterSelections ?? [],
          answers: {
            create: ws2Answers.map(({ itemId, value }) => ({ itemId, value })),
          },
        },
      });
    }

    return NextResponse.json({ success: true, groupId: group.id, slug: group.slug });
  } catch {
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
