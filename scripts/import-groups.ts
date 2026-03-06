// SPDX-License-Identifier: AGPL-3.0-only
// Imports Hochschulgruppen data from CSV into the database

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

const prisma = new PrismaClient();

// ─── Category mapping ─────────────────────────────────────────────────────────

const CATEGORY_NAMES = [
  "Religion & Weltanschauung",
  "Sport & Bewegung",
  "Kultur & Kunst",
  "Technik & Wissenschaft",
  "Soziales & Beratung",
  "International & Sprachen",
  "Fachschaft & Studium",
  "Sonstiges",
] as const;

function determineCategoryName(row: CsvRow): string {
  if (row.religion === "1") return "Religion & Weltanschauung";
  if (row.sports === "1") return "Sport & Bewegung";
  if (row.arts === "1" || row.music === "1") return "Kultur & Kunst";
  if (row.tech === "1") return "Technik & Wissenschaft";
  if (row.social_impact === "1") return "Soziales & Beratung";
  if (row.international === "1") return "International & Sprachen";
  if (row.career === "1") return "Fachschaft & Studium";
  return "Sonstiges";
}

// ─── Slug generation ──────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── CSV row type ─────────────────────────────────────────────────────────────

interface CsvRow {
  name: string;
  career: string;
  tech: string;
  language: string;
  social_impact: string;
  party: string;
  religion: string;
  sports: string;
  networking: string;
  arts: string;
  music: string;
  time_low: string;
  hands_on: string;
  outdoor: string;
  international: string;
  beginner_friendly: string;
  competitive: string;
  financial_cost: string;
  event_frequency: string;
  leadership_opportunities: string;
  group_size: string;
  description: string;
  next_event_title: string;
  next_event_date: string;
  next_event_time: string;
  next_event_location: string;
  next_event_url: string;
  next_event_is_open: string;
  event_source_type: string;
}

function toBool(val: string): boolean {
  return val === "1";
}

function toNullable(val: string): string | null {
  return val === "EMPTY" || val === "" ? null : val;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.resolve(process.cwd(), "data/hg_MERGED.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, ""); // strip BOM

  const { data, errors } = Papa.parse<CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.error("CSV parse errors:", errors);
    process.exit(1);
  }

  console.log(`Parsed ${data.length} rows from CSV`);

  // Ensure all required categories exist
  const categoryMap = new Map<string, string>(); // name → id

  for (const catName of CATEGORY_NAMES) {
    const cat = await prisma.category.upsert({
      where: { name: catName },
      create: { name: catName },
      update: {},
    });
    categoryMap.set(catName, cat.id);
  }

  console.log(`Ensured ${categoryMap.size} categories`);

  // Track slugs used in this run to avoid collisions within the CSV
  const usedSlugs = new Map<string, number>();

  let created = 0;
  let updated = 0;

  for (const row of data) {
    if (!row.name?.trim()) continue;

    const categoryName = determineCategoryName(row);
    const categoryId = categoryMap.get(categoryName)!;

    const description = row.description?.trim() ?? "";
    const shortDescription = description.slice(0, 200);

    // Generate unique slug
    let baseSlug = generateSlug(row.name);
    if (!baseSlug) baseSlug = "gruppe";
    const count = usedSlugs.get(baseSlug) ?? 0;
    usedSlugs.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    const groupData = {
      slug,
      shortDescription,
      longDescription: description || null,
      categoryId,
      isActive: true,
      isVerified: false,
      // Matching attributes
      career: toBool(row.career),
      tech: toBool(row.tech),
      socialImpact: toBool(row.social_impact),
      party: toBool(row.party),
      religion: toBool(row.religion),
      sports: toBool(row.sports),
      networking: toBool(row.networking),
      arts: toBool(row.arts),
      music: toBool(row.music),
      timeLow: toBool(row.time_low),
      handsOn: toBool(row.hands_on),
      outdoor: toBool(row.outdoor),
      international: toBool(row.international),
      beginnerFriendly: toBool(row.beginner_friendly),
      competitive: toBool(row.competitive),
      financialCost: toBool(row.financial_cost),
      leadershipOpportunities: toBool(row.leadership_opportunities),
      // Categorical
      language: toNullable(row.language),
      eventFrequency: toNullable(row.event_frequency),
      groupSize: toNullable(row.group_size),
      // Event data
      nextEventTitle: toNullable(row.next_event_title),
      nextEventDate: toNullable(row.next_event_date),
      nextEventTime: toNullable(row.next_event_time),
      nextEventLocation: toNullable(row.next_event_location),
      nextEventUrl: toNullable(row.next_event_url),
      nextEventIsOpen: toBool(row.next_event_is_open),
    };

    const existing = await prisma.group.findFirst({ where: { name: row.name } });

    if (existing) {
      await prisma.group.update({
        where: { id: existing.id },
        data: groupData,
      });
      updated++;
    } else {
      await prisma.group.create({
        data: { name: row.name, ...groupData },
      });
      created++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
