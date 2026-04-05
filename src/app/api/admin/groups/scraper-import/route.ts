// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: import groups from scraper JSON output (output/groups.json)
//
// POST /api/admin/groups/scraper-import
// Body: array of scraper group objects (or { groups: [...] })
//
// For each group:
//  - upserts by slug (derived from name)
//  - sets scraperAttributes (raw JSON for admin review)
//  - sets all 17 boolean attribute fields from scraper values
//  - sets language, eventFrequency, groupSize from categorical values
//  - does NOT touch confirmedAttributes (admin reviews separately)
//  - sets registrationStatus = "invited" if not already submitted/verified

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";

// ── Schema ──────────────────────────────────────────────────────

const attrBoolSchema = z.object({
  value: z.union([z.number(), z.boolean()]),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  reason: z.string().optional(),
});

const attrStrSchema = z.object({
  value: z.string(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  reason: z.string().optional(),
});

const scraperGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().optional(),
  sources: z.array(z.string()).optional(),
  attributes: z.object({
    career: attrBoolSchema,
    tech: attrBoolSchema,
    socialImpact: attrBoolSchema,
    party: attrBoolSchema,
    religion: attrBoolSchema,
    sports: attrBoolSchema,
    networking: attrBoolSchema,
    arts: attrBoolSchema,
    music: attrBoolSchema,
    timeLow: attrBoolSchema,
    handsOn: attrBoolSchema,
    outdoor: attrBoolSchema,
    international: attrBoolSchema,
    beginnerFriendly: attrBoolSchema,
    competitive: attrBoolSchema,
    financialCost: attrBoolSchema,
    leadershipOpportunities: attrBoolSchema,
    language: attrStrSchema,
    eventFrequency: attrStrSchema,
    groupSize: attrStrSchema,
  }),
  _scraped_at: z.string().optional(),
  _model: z.string().optional(),
});

const importBodySchema = z.union([
  z.array(scraperGroupSchema),
  z.object({ groups: z.array(scraperGroupSchema) }),
]);

// ── Helpers ─────────────────────────────────────────────────────

import { slugify } from "@/lib/utils";

function boolVal(attr: { value: number | boolean }): boolean {
  return attr.value === 1 || attr.value === true;
}

function strVal(attr: { value: string }, allowed: string[], fallback: string): string {
  return allowed.includes(attr.value) ? attr.value : fallback;
}

/** Determine the best category name from boolean attributes. */
function determineCategoryName(attrs: Record<string, { value: number | boolean | string }>): string {
  const b = (key: string) => attrs[key]?.value === 1 || attrs[key]?.value === true;
  if (b("arts") || b("music")) return "Kultur & Kunst";
  if (b("sports")) return "Sport & Bewegung";
  if (b("tech")) return "Technik & Wissenschaft";
  if (b("international")) return "International & Sprachen";
  if (b("socialImpact") && b("outdoor")) return "Umwelt & Nachhaltigkeit";
  if (b("socialImpact")) return "Soziales & Beratung";
  return "Politik & Gesellschaft";
}

// ── Route ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = importBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const groups = Array.isArray(parsed.data) ? parsed.data : parsed.data.groups;

  // Load all categories for attribute-based assignment
  const allCategories = await db.category.findMany({ orderBy: { order: "asc" } });
  if (allCategories.length === 0) {
    return NextResponse.json({ error: "No categories found — run seed first" }, { status: 500 });
  }
  const catByName = new Map(allCategories.map((c) => [c.name, c.id]));
  const defaultCategory = allCategories[0];

  let upserted = 0;
  let skipped = 0;
  const errors: { name: string; error: string }[] = [];

  for (const g of groups) {
    try {
      const slug = slugify(g.name);
      const attrs = g.attributes;

      // Map scraper output to Group boolean fields
      const boolFields = {
        career:                  boolVal(attrs.career),
        tech:                    boolVal(attrs.tech),
        socialImpact:            boolVal(attrs.socialImpact),
        party:                   boolVal(attrs.party),
        religion:                boolVal(attrs.religion),
        sports:                  boolVal(attrs.sports),
        networking:              boolVal(attrs.networking),
        arts:                    boolVal(attrs.arts),
        music:                   boolVal(attrs.music),
        timeLow:                 boolVal(attrs.timeLow),
        handsOn:                 boolVal(attrs.handsOn),
        outdoor:                 boolVal(attrs.outdoor),
        international:           boolVal(attrs.international),
        beginnerFriendly:        boolVal(attrs.beginnerFriendly),
        competitive:             boolVal(attrs.competitive),
        financialCost:           boolVal(attrs.financialCost),
        leadershipOpportunities: boolVal(attrs.leadershipOpportunities),
      };

      const catFields = {
        language:       strVal(attrs.language, ["german", "both", "english"], "german"),
        eventFrequency: strVal(attrs.eventFrequency, ["low", "medium", "high"], "medium"),
        groupSize:      strVal(attrs.groupSize, ["small", "medium", "large"], "medium"),
      };

      const existing = await db.group.findUnique({ where: { slug } });

      // Determine best category from attributes
      const bestCatName = determineCategoryName(attrs);
      const bestCategoryId = catByName.get(bestCatName) ?? defaultCategory.id;

      if (existing) {
        // Update attributes, scraperAttributes, and category
        await db.group.update({
          where: { slug },
          data: {
            ...boolFields,
            ...catFields,
            categoryId: bestCategoryId,
            scraperAttributes: attrs as object,
            // Keep existing registration status unless it's null
            registrationStatus: existing.registrationStatus ?? RegistrationStatus.INVITED,
          },
        });
      } else {
        // Create new group from scraper data
        await db.group.create({
          data: {
            name: g.name,
            slug,
            shortDescription: g.description?.slice(0, 200) ?? g.name,
            longDescription: g.description ?? null,
            websiteUrl: g.website || null,
            categoryId: bestCategoryId,
            registeredVia: "import",
            registeredAt: new Date(),
            registrationStatus: RegistrationStatus.INVITED,
            ...boolFields,
            ...catFields,
            scraperAttributes: attrs as object,
          },
        });
      }

      upserted++;
    } catch (err) {
      errors.push({ name: g.name, error: String(err) });
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    upserted,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
