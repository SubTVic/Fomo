// SPDX-License-Identifier: AGPL-3.0-only
//
// Bridge from SCRAPED group data to the matching algorithm.
//
// Registered groups rate themselves on the WS2 items (real selfRating, produced
// by the registration flow — which we DO NOT change). Groups that have not
// registered yet have no self-rating, so the matcher would treat every item as
// neutral. This script DERIVES a provisional selfRating for them from the 17
// scraped binary attributes + groupSize/eventFrequency/language, using the
// exact item→attribute mappings declared in quiz.json. Identical schema, so the
// static site needs zero code changes.
//
// A real registration always wins: pass the registration export via --overrides
// and those groups keep their human-entered answers (no re-registration ever
// needed). Derived groups are flagged `selfRating.derived = true` so the UI /
// admin can show "automatisch ermittelt, noch nicht bestätigt".
//
//   node scripts/derive-selfrating.mjs \
//     --in scraped-groups.json \            # groups with attributes, maybe no selfRating
//     --quiz data/quiz.json \
//     --overrides registration-export.json \ # optional: real selfRatings (by id or slug)
//     --out data/groups.json

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};

const inPath = getArg("--in", "data/groups.json");
const quizPath = getArg("--quiz", "data/quiz.json");
const overridesPath = getArg("--overrides", null);
const outPath = getArg("--out", "data/groups.json");

const input = JSON.parse(readFileSync(inPath, "utf8"));
const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
const groups = input.groups ?? input;

// Map a scraped attribute name to the group field a valueMap reads from.
const VALUE_MAP_FIELD = {
  groupSize: "groupSize",
  eventFrequency: "eventFrequency",
  language: "language",
};

const clamp = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** Derive one item's answer (-1|0|1) from a group's scraped data. */
function deriveItemValue(group, item) {
  const contributions = [];
  for (const m of item.attributes) {
    let raw;
    if (m.valueMap) {
      const field = VALUE_MAP_FIELD[m.attribute];
      const fieldVal = field ? group[field] : undefined;
      raw = fieldVal != null && m.valueMap[fieldVal] != null ? m.valueMap[fieldVal] : 0;
    } else {
      const attrVal = group.attributes?.[m.attribute];
      // Unknown attribute (e.g. WS2-21 "entrepreneurship" is not among the 17
      // registration attributes) → neutral, cannot be inferred from scraping.
      raw = attrVal === true ? 1 : attrVal === false ? -1 : 0;
    }
    if (m.isInverse) raw = -raw;
    contributions.push(raw);
  }
  if (contributions.length === 0) return 0;
  const avg = contributions.reduce((a, b) => a + b, 0) / contributions.length;
  return clamp(Math.round(avg));
}

/** Filter selections a scraped group implies (its true filter attributes). */
function deriveFilterSelections(group) {
  return quiz.filters.options
    .filter((o) => group.attributes?.[o.attribute] === true)
    .map((o) => o.attribute);
}

// Build override index (by id and by slug) from a registration export.
const overrideById = new Map();
const overrideBySlug = new Map();
if (overridesPath) {
  const ov = JSON.parse(readFileSync(overridesPath, "utf8"));
  const list = ov.groups ?? ov;
  for (const g of list) {
    if (!g.selfRating?.answers?.length) continue;
    if (g.id) overrideById.set(g.id, g.selfRating);
    if (g.slug) overrideBySlug.set(g.slug, g.selfRating);
  }
}

let derivedCount = 0;
let realCount = 0;
const out = groups.map((g) => {
  const real =
    (g.id && overrideById.get(g.id)) ||
    (g.slug && overrideBySlug.get(g.slug)) ||
    // A group that already carries a real (non-derived) selfRating keeps it.
    (g.selfRating?.answers?.length && !g.selfRating?.derived ? g.selfRating : null);

  if (real) {
    realCount++;
    return { ...g, selfRating: { ...real, derived: false } };
  }

  derivedCount++;
  const answers = quiz.items.map((item) => ({
    itemId: item.id,
    value: deriveItemValue(g, item),
  }));
  return {
    ...g,
    selfRating: {
      raterCount: 0,
      derived: true,
      filterSelections: deriveFilterSelections(g),
      answers,
    },
  };
});

const result = input.groups ? { ...input, groups: out } : out;
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(
  `Derived selfRating for ${derivedCount} group(s); kept real selfRating for ${realCount}.`,
);
console.log(`Wrote ${out.length} groups → ${outPath}`);
