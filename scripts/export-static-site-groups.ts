// SPDX-License-Identifier: AGPL-3.0-only
//
// Build static-site/data/groups.json from prod: every active group (verified
// + unverified), with real selfRatings where available, and naive-derived
// selfRatings for the rest (flagged `derived: true`).
//
// Usage:
//   DATABASE_URL="<prod url>" npx tsx scripts/export-static-site-groups.ts
//
// The static-site bundle then needs to be rebuilt (next build) for changes to
// land in the browser. Idempotent — safe to re-run any time the DB changes.

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const QUIZ_PATH = path.join(REPO_ROOT, "static-site/data/quiz.json");
const OUT_PATH = path.join(REPO_ROOT, "static-site/data/groups.json");

const BINARY_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports", "networking",
  "arts", "music", "timeLow", "handsOn", "outdoor", "international",
  "beginnerFriendly", "competitive", "financialCost", "leadershipOpportunities",
] as const;

const VALUE_MAP_FIELD: Record<string, "groupSize" | "eventFrequency" | "language"> = {
  groupSize: "groupSize",
  eventFrequency: "eventFrequency",
  language: "language",
};

interface QuizItem {
  id: string;
  attributes: Array<{
    attribute: string;
    isInverse?: boolean;
    valueMap?: Record<string, number>;
  }>;
}

interface ScrapedShape {
  attributes: Record<string, boolean>;
  groupSize: string | null;
  eventFrequency: string | null;
  language: string | null;
}

/** Hand-coded mapping: derive an item's -1|0|1 from quiz.json item.attributes. */
function naiveItemValue(group: ScrapedShape, item: QuizItem): -1 | 0 | 1 {
  const contributions: number[] = [];
  for (const m of item.attributes) {
    let raw = 0;
    if (m.valueMap) {
      const field = VALUE_MAP_FIELD[m.attribute];
      const fieldVal = field ? group[field] : undefined;
      raw = fieldVal != null && m.valueMap[fieldVal] != null ? m.valueMap[fieldVal] : 0;
    } else {
      const attrVal = group.attributes[m.attribute];
      raw = attrVal === true ? 1 : attrVal === false ? -1 : 0;
    }
    if (m.isInverse) raw = -raw;
    contributions.push(raw);
  }
  const sum = contributions.reduce((a, b) => a + b, 0);
  return sum > 0 ? 1 : sum < 0 ? -1 : 0;
}

async function main() {
  const quiz = JSON.parse(readFileSync(QUIZ_PATH, "utf8")) as {
    items: QuizItem[];
    filters: { options: Array<{ attribute: string }> };
  };

  const db = new PrismaClient();
  try {
    const dbGroups = await db.group.findMany({
      where: { isActive: true },
      include: {
        category: true,
        selfRating: { include: { answers: true } },
      },
      orderBy: { name: "asc" },
    });

    let verifiedCount = 0;
    let derivedCount = 0;

    const groups = dbGroups.map((g) => {
      const attributes = Object.fromEntries(
        BINARY_ATTRS.map((a) => [a, (g as unknown as Record<string, boolean>)[a] === true]),
      ) as Record<string, boolean>;

      const scrapedShape: ScrapedShape = {
        attributes,
        groupSize: g.groupSize,
        eventFrequency: g.eventFrequency,
        language: g.language,
      };

      const realRating = g.selfRating;
      const hasRealRating =
        g.isVerified && realRating != null && realRating.answers.length > 0;

      let selfRating: {
        raterCount: number;
        derived: boolean;
        filterSelections: string[];
        answers: Array<{ itemId: string; value: number }>;
      };

      if (hasRealRating) {
        verifiedCount++;
        selfRating = {
          raterCount: realRating.raterCount,
          derived: false,
          filterSelections: realRating.filterSelections ?? [],
          answers: realRating.answers.map((a) => ({ itemId: a.itemId, value: a.value })),
        };
      } else {
        derivedCount++;
        selfRating = {
          raterCount: 0,
          derived: true,
          filterSelections: quiz.filters.options
            .filter((o) => attributes[o.attribute] === true)
            .map((o) => o.attribute),
          answers: quiz.items.map((item) => ({
            itemId: item.id,
            value: naiveItemValue(scrapedShape, item),
          })),
        };
      }

      const nextEvent =
        g.nextEventTitle && g.nextEventDate
          ? {
              title: g.nextEventTitle,
              date: g.nextEventDate,
              time: g.nextEventTime,
              location: g.nextEventLocation,
              url: g.nextEventUrl,
              isOpen: g.nextEventIsOpen,
            }
          : null;

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        shortDescription: g.shortDescription,
        longDescription: g.longDescription,
        categoryName: g.category.name,
        categoryColor: g.category.color ?? "",
        categoryIcon: g.category.icon ?? "",
        websiteUrl: g.websiteUrl,
        instagramUrl: g.instagramUrl,
        contactEmail: g.contactEmail,
        memberCount: g.memberCount,
        language: g.language,
        eventFrequency: g.eventFrequency,
        groupSize: g.groupSize,
        motto: g.motto,
        foundedYear: g.foundedYear,
        logoUrl: g.logoUrl,
        attributes,
        nextEvent,
        selfRating,
      };
    });

    const output = {
      _meta: {
        source: "prod DB via export-static-site-groups.ts",
        generatedAt: new Date().toISOString(),
        groupCount: groups.length,
        verifiedCount,
        derivedCount,
        note: "All active groups. Verified have real selfRatings; unverified use naive-derived ratings flagged derived: true.",
      },
      groups,
    };

    writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`✅ wrote ${groups.length} groups → ${path.relative(REPO_ROOT, OUT_PATH)}`);
    console.log(`   • ${verifiedCount} verified (real selfRating)`);
    console.log(`   • ${derivedCount} unverified (derived selfRating)`);
    console.log(`\nNext: rebuild the static-site (cd static-site && npm run build) or refresh the dev server.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n❌ Export failed:", e);
  process.exit(1);
});
