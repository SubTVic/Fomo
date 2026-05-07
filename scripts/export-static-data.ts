// SPDX-License-Identifier: AGPL-3.0-only
//
// §7.3 Export DB → JSON files for future static hosting migration.
// Run this locally against prod DB to generate the static data bundle.
//
// Usage:
//   npx tsx scripts/export-static-data.ts
//   npx tsx scripts/export-static-data.ts --out static-data/
//
// Output:
//   static-data/groups.json     — all active groups (for client-side matching)
//   static-data/theses.json     — all active quiz theses

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "static-data");

const MATCHING_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports",
  "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
  "international", "beginnerFriendly", "competitive", "financialCost",
  "leadershipOpportunities",
] as const;

async function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outDir = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : DEFAULT_OUT;

  fs.mkdirSync(outDir, { recursive: true });

  const prisma = new PrismaClient();

  try {
    // ── Groups ──────────────────────────────────────────────────
    const dbGroups = await prisma.group.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const groups = dbGroups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      shortDescription: g.shortDescription,
      longDescription: g.longDescription,
      categoryName: g.category.name,
      websiteUrl: g.websiteUrl,
      instagramUrl: g.instagramUrl,
      contactEmail: g.contactEmail,
      attributes: Object.fromEntries(
        MATCHING_ATTRS.map((attr) => [attr, g[attr] as boolean])
      ),
      nextEventTitle: g.nextEventTitle,
      nextEventDate: g.nextEventDate,
      nextEventTime: g.nextEventTime,
      nextEventLocation: g.nextEventLocation,
      nextEventUrl: g.nextEventUrl,
      nextEventIsOpen: g.nextEventIsOpen,
    }));

    const groupsPath = path.join(outDir, "groups.json");
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2), "utf-8");
    console.log(`✅ ${groups.length} Gruppen → ${path.relative(REPO_ROOT, groupsPath)}`);

    // ── Theses ──────────────────────────────────────────────────
    const dbTheses = await prisma.quizThesis.findMany({
      where: { isActive: true },
      include: { attributes: { select: { attribute: true, isInverse: true } } },
      orderBy: { order: "asc" },
    });

    const theses = dbTheses.map((t) => ({
      id: t.id,
      text: t.text,
      shortTitle: t.shortTitle,
      hint: t.hint,
      order: t.order,
      attributes: t.attributes,
    }));

    const thesesPath = path.join(outDir, "theses.json");
    fs.writeFileSync(thesesPath, JSON.stringify(theses, null, 2), "utf-8");
    console.log(`✅ ${theses.length} Thesen → ${path.relative(REPO_ROOT, thesesPath)}`);

    console.log(`\n→ Static-Übergang: Quiz-Client auf /static-data/*.json umzeigen statt /api/data/groups`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
