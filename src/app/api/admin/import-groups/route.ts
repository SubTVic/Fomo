// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: trigger CSV import of Hochschulgruppen

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

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

function toBool(val: string): boolean {
  return val === "1";
}

function toNullable(val: string): string | null {
  return val === "EMPTY" || val === "" ? null : val;
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const csvPath = path.resolve(process.cwd(), "data/hg_MERGED.csv");
  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: "CSV-Datei nicht gefunden" }, { status: 404 });
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "");
  const { data, errors } = Papa.parse<CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: "CSV-Fehler", details: errors }, { status: 422 });
  }

  // Ensure categories exist
  const categoryMap = new Map<string, string>();
  for (const catName of CATEGORY_NAMES) {
    const cat = await db.category.upsert({
      where: { name: catName },
      create: { name: catName },
      update: {},
    });
    categoryMap.set(catName, cat.id);
  }

  try {
    const usedSlugs = new Map<string, number>();
    let created = 0;
    let updated = 0;

    for (const row of data) {
      if (!row.name?.trim()) continue;

      const categoryName = determineCategoryName(row);
      const categoryId = categoryMap.get(categoryName)!;
      const description = row.description?.trim() ?? "";

      let baseSlug = generateSlug(row.name);
      if (!baseSlug) baseSlug = "gruppe";
      const count = usedSlugs.get(baseSlug) ?? 0;
      usedSlugs.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

      const groupData = {
        slug,
        shortDescription: description.slice(0, 200),
        longDescription: description || null,
        categoryId,
        isActive: true,
        isVerified: false,
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
        language: toNullable(row.language),
        eventFrequency: toNullable(row.event_frequency),
        groupSize: toNullable(row.group_size),
        nextEventTitle: toNullable(row.next_event_title),
        nextEventDate: toNullable(row.next_event_date),
        nextEventTime: toNullable(row.next_event_time),
        nextEventLocation: toNullable(row.next_event_location),
        nextEventUrl: toNullable(row.next_event_url),
        nextEventIsOpen: toBool(row.next_event_is_open),
      };

      const existing = await db.group.findFirst({ where: { name: row.name } });
      if (existing) {
        await db.group.update({ where: { id: existing.id }, data: groupData });
        updated++;
      } else {
        await db.group.create({ data: { name: row.name, ...groupData } });
        created++;
      }
    }

    return NextResponse.json({
      message: `${created} neu, ${updated} aktualisiert`,
      created,
      updated,
    });
  } catch {
    return NextResponse.json(
      { error: "Import fehlgeschlagen" },
      { status: 500 }
    );
  }
}
