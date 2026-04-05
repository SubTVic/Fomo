// SPDX-License-Identifier: AGPL-3.0-only
// Quick script to import scraper attributes from groups.json into existing groups.
// Usage: npx tsx scripts/import-scraper-attributes.ts <path-to-groups.json>

import { PrismaClient, RegistrationStatus } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

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

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: npx tsx scripts/import-scraper-attributes.ts <path-to-groups.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(resolve(jsonPath), "utf-8"));
  const groups = Array.isArray(raw) ? raw : raw.groups;
  console.log(`📦 ${groups.length} Gruppen in JSON gefunden`);

  let updated = 0;
  let created = 0;
  let skipped = 0;

  const defaultCategory = await prisma.category.findFirst({ orderBy: { order: "asc" } });
  if (!defaultCategory) {
    console.error("❌ Keine Kategorien in der DB — erst `npx prisma db seed` ausführen");
    process.exit(1);
  }

  for (const g of groups) {
    const slug = slugify(g.name);
    const attrs = g.attributes;

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

    const existing = await prisma.group.findUnique({ where: { slug } });

    if (existing) {
      await prisma.group.update({
        where: { slug },
        data: {
          ...boolFields,
          ...catFields,
          scraperAttributes: attrs as object,
          registrationStatus: existing.registrationStatus ?? RegistrationStatus.INVITED,
        },
      });
      updated++;
    } else {
      await prisma.group.create({
        data: {
          name: g.name,
          slug,
          shortDescription: (g.description ?? g.name).slice(0, 200),
          longDescription: g.description ?? null,
          websiteUrl: g.website || null,
          categoryId: defaultCategory.id,
          registeredVia: "import",
          registeredAt: new Date(),
          registrationStatus: RegistrationStatus.INVITED,
          ...boolFields,
          ...catFields,
          scraperAttributes: attrs as object,
        },
      });
      created++;
    }
  }

  console.log(`✅ Import abgeschlossen: ${updated} aktualisiert, ${created} neu erstellt, ${skipped} übersprungen`);
}

main()
  .catch((e) => { console.error("❌ Import fehlgeschlagen:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
