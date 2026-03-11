// SPDX-License-Identifier: AGPL-3.0-only
//
// Import scraper results into the database.
// Usage: npx tsx scripts/import-scraper-results.ts <path-to-json>
//
// Expected JSON format:
// [
//   {
//     "name": "AEGEE-Dresden e. V.",
//     "attributes": {
//       "career": { "value": 1, "confidence": 0.8, "reason": "..." },
//       "tech": { "value": 0, "confidence": 0.5, "reason": "..." },
//       ...
//     }
//   },
//   ...
// ]

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

interface ScraperAttribute {
  value: 0 | 1;
  confidence: number;
  reason?: string;
}

interface ScraperGroup {
  name: string;
  attributes: Record<string, ScraperAttribute>;
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: npx tsx scripts/import-scraper-results.ts <path-to-json>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(jsonPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  const scraperGroups: ScraperGroup[] = JSON.parse(raw);

  console.log(`Loaded ${scraperGroups.length} groups from scraper results`);

  const prisma = new PrismaClient();

  try {
    const dbGroups = await prisma.group.findMany({
      select: { id: true, name: true },
    });

    // Build a name-normalized lookup map
    const normalizedMap = new Map<string, { id: string; name: string }>();
    for (const g of dbGroups) {
      normalizedMap.set(normalizeName(g.name), g);
    }

    let matched = 0;
    let notFound = 0;

    for (const scraperGroup of scraperGroups) {
      const normalized = normalizeName(scraperGroup.name);
      const dbGroup = normalizedMap.get(normalized);

      if (!dbGroup) {
        console.warn(`  [SKIP] No DB match for: "${scraperGroup.name}"`);
        notFound++;
        continue;
      }

      await prisma.group.update({
        where: { id: dbGroup.id },
        data: {
          scraperAttributes: JSON.parse(JSON.stringify(scraperGroup.attributes)),
          registrationStatus: "invited",
        },
      });

      console.log(`  [OK] ${dbGroup.name}`);
      matched++;
    }

    console.log(`\nDone: ${matched} matched, ${notFound} not found`);
  } finally {
    await prisma.$disconnect();
  }
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/e\.\s*v\.?/gi, "ev")
    .replace(/[^a-z0-9äöüß ]/g, "")
    .trim();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
