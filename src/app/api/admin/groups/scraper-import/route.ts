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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function boolVal(attr: { value: number | boolean }): boolean {
  return attr.value === 1 || attr.value === true;
}

function strVal(attr: { value: string }, allowed: string[], fallback: string): string {
  return allowed.includes(attr.value) ? attr.value : fallback;
}

// ── Route ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Need a default category for new groups
  const defaultCategory = await db.category.findFirst({ orderBy: { order: "asc" } });
  if (!defaultCategory) {
    return NextResponse.json({ error: "No categories found — run seed first" }, { status: 500 });
  }

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

      if (existing) {
        // Only update attributes and scraperAttributes — preserve human edits
        await db.group.update({
          where: { slug },
          data: {
            ...boolFields,
            ...catFields,
            scraperAttributes: attrs as object,
            // Keep existing registration status unless it's null
            registrationStatus: existing.registrationStatus ?? "invited",
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
            categoryId: defaultCategory.id,
            registeredVia: "import",
            registeredAt: new Date(),
            registrationStatus: "invited",
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
