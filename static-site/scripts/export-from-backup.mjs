// SPDX-License-Identifier: AGPL-3.0-only
//
// Build static-site/data/groups.json from a FOMO backup JSON (the admin export
// dump), without needing prod DB access. Mirrors the logic of the repo's
// scripts/export-static-site-groups.ts: every active group (verified +
// unverified), real selfRatings where available, naive-derived (flagged
// derived:true) for the rest.
//
//   node scripts/export-from-backup.mjs --backup <fomo-backup.json> \
//     [--quiz data/quiz.json] [--out data/groups.json]
//
// Backup files contain PII (admins/contacts/sessions) — do NOT commit them.
// Only the sanitized groups.json output is public.

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const backupPath = getArg("--backup", null);
const quizPath = getArg("--quiz", "data/quiz.json");
const outPath = getArg("--out", "data/groups.json");
if (!backupPath) {
  console.error("Usage: node scripts/export-from-backup.mjs --backup <file.json> [--out data/groups.json]");
  process.exit(1);
}

const BINARY_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports", "networking",
  "arts", "music", "timeLow", "handsOn", "outdoor", "international",
  "beginnerFriendly", "competitive", "financialCost", "leadershipOpportunities",
];
const VALUE_MAP_FIELD = { groupSize: "groupSize", eventFrequency: "eventFrequency", language: "language" };

/** Hand-coded mapping: derive an item's -1|0|1 from quiz.json item.attributes. */
function naiveItemValue(shape, item) {
  const contributions = [];
  for (const m of item.attributes) {
    let raw = 0;
    if (m.valueMap) {
      const field = VALUE_MAP_FIELD[m.attribute];
      const fieldVal = field ? shape[field] : undefined;
      raw = fieldVal != null && m.valueMap[fieldVal] != null ? m.valueMap[fieldVal] : 0;
    } else {
      raw = shape.attributes[m.attribute] === true ? 1 : shape.attributes[m.attribute] === false ? -1 : 0;
    }
    if (m.isInverse) raw = -raw;
    contributions.push(raw);
  }
  const sum = contributions.reduce((a, b) => a + b, 0);
  return sum > 0 ? 1 : sum < 0 ? -1 : 0;
}

const backup = JSON.parse(readFileSync(backupPath, "utf8"));
const quiz = JSON.parse(readFileSync(quizPath, "utf8"));

const catById = new Map(backup.categories.map((c) => [c.id, c]));
const ratingByGroup = new Map(backup.groupSelfRatings.map((r) => [r.groupId, r]));
const answersByRating = new Map();
for (const a of backup.groupSelfRatingAnswers) {
  if (!answersByRating.has(a.ratingId)) answersByRating.set(a.ratingId, []);
  answersByRating.get(a.ratingId).push({ itemId: a.itemId, value: a.value });
}

let verifiedCount = 0;
let derivedCount = 0;

const groups = backup.groups
  .filter((g) => g.isActive)
  .sort((a, b) => a.name.localeCompare(b.name, "de"))
  .map((g) => {
    const attributes = Object.fromEntries(BINARY_ATTRS.map((a) => [a, g[a] === true]));
    const shape = { attributes, groupSize: g.groupSize, eventFrequency: g.eventFrequency, language: g.language };
    const cat = catById.get(g.categoryId);

    const rating = ratingByGroup.get(g.id);
    const realAnswers = rating ? answersByRating.get(rating.id) ?? [] : [];
    const hasRealRating = g.isVerified && rating != null && realAnswers.length > 0;

    let selfRating;
    if (hasRealRating) {
      verifiedCount++;
      selfRating = {
        raterCount: rating.raterCount ?? 0,
        derived: false,
        filterSelections: rating.filterSelections ?? [],
        answers: realAnswers,
      };
    } else {
      derivedCount++;
      selfRating = {
        raterCount: 0,
        derived: true,
        filterSelections: quiz.filters.options
          .filter((o) => attributes[o.attribute] === true)
          .map((o) => o.attribute),
        answers: quiz.items.map((item) => ({ itemId: item.id, value: naiveItemValue(shape, item) })),
      };
    }

    const nextEvent =
      g.nextEventTitle && g.nextEventDate
        ? {
            title: g.nextEventTitle,
            date: g.nextEventDate,
            time: g.nextEventTime ?? null,
            location: g.nextEventLocation ?? null,
            url: g.nextEventUrl ?? null,
            isOpen: g.nextEventIsOpen ?? false,
          }
        : null;

    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      shortDescription: g.shortDescription,
      longDescription: g.longDescription,
      categoryName: cat?.name ?? "Sonstiges",
      categoryColor: cat?.color ?? "",
      categoryIcon: cat?.icon ?? "",
      websiteUrl: g.websiteUrl ?? null,
      instagramUrl: g.instagramUrl ?? null,
      contactEmail: g.contactEmail ?? null,
      memberCount: g.memberCount ?? null,
      language: g.language ?? null,
      eventFrequency: g.eventFrequency ?? null,
      groupSize: g.groupSize ?? null,
      motto: g.motto ?? null,
      foundedYear: g.foundedYear ?? null,
      logoUrl: g.logoUrl ?? null,
      attributes,
      nextEvent,
      selfRating,
    };
  });

const output = {
  _meta: {
    source: `backup: ${backupPath.split("/").pop()}`,
    generatedAt: new Date().toISOString(),
    groupCount: groups.length,
    verifiedCount,
    derivedCount,
    note: "All active groups. Verified have real selfRatings; unverified use naive-derived ratings flagged derived:true (excluded from quiz matching).",
  },
  groups,
};
writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
console.log(`✅ wrote ${groups.length} groups → ${outPath}`);
console.log(`   • ${verifiedCount} verified (real selfRating, in matching)`);
console.log(`   • ${derivedCount} unverified (derived, browse-only)`);
