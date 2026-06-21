// SPDX-License-Identifier: AGPL-3.0-only
//
// Merge step: combine scraped groups with real registrations into the final
// data/groups.json.
//
// Priority per group:
//   1. a real registration (via --overrides, matched by id or slug) — wins
//      always, flagged derived:false (no re-registration ever needed).
//   2. an existing selfRating on the group (e.g. produced directly by
//      scrape-groups.mjs) — kept as-is.
//   3. LEGACY fallback: if a group has only the old 17 attributes and no
//      selfRating, derive one from quiz.json's item mapping (optionally a
//      learned --model). The static site no longer needs the 17 attributes, so
//      this path only matters for old attribute-only inputs.
//
//   node scripts/derive-selfrating.mjs \
//     --in scraped-groups.json \
//     --quiz data/quiz.json \
//     --overrides registration-export.json \
//     --out data/groups.json \
//     [--model data/derive-model.json]   # legacy attribute path only

import { readFileSync, writeFileSync } from "node:fs";
import { naiveItemValue, learnedItemValue } from "./derive-lib.mjs";

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};

const inPath = getArg("--in", "data/groups.json");
const quizPath = getArg("--quiz", "data/quiz.json");
const modelPath = getArg("--model", null);
const overridesPath = getArg("--overrides", null);
const outPath = getArg("--out", "data/groups.json");

const input = JSON.parse(readFileSync(inPath, "utf8"));
const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
const groups = input.groups ?? input;
const model = modelPath ? JSON.parse(readFileSync(modelPath, "utf8")) : null;

// Build override index (by id and by slug) from a registration export.
const overrideById = new Map();
const overrideBySlug = new Map();
if (overridesPath) {
  const ov = JSON.parse(readFileSync(overridesPath, "utf8"));
  for (const g of ov.groups ?? ov) {
    if (!g.selfRating?.answers?.length) continue;
    if (g.id) overrideById.set(g.id, g.selfRating);
    if (g.slug) overrideBySlug.set(g.slug, g.selfRating);
  }
}

/** LEGACY: derive a selfRating from old 17 attributes (no selfRating present). */
function deriveFromAttributes(g) {
  const im = (item) => model?.items?.[item.id];
  const answers = quiz.items.map((item) => ({
    itemId: item.id,
    value: im(item)?.useLearned ? learnedItemValue(g, im(item), model.threshold) : naiveItemValue(g, item),
  }));
  const filterSelections = quiz.filters.options
    .filter((o) => g.attributes?.[o.attribute] === true)
    .map((o) => o.attribute);
  return { raterCount: 0, derived: true, filterSelections, answers };
}

let real = 0, kept = 0, legacy = 0;
const out = groups.map((g) => {
  const override = (g.id && overrideById.get(g.id)) || (g.slug && overrideBySlug.get(g.slug));
  if (override) {
    real++;
    return { ...g, selfRating: { ...override, derived: false } };
  }
  if (g.selfRating?.answers?.length) {
    kept++;
    return g; // keep existing (scraped/derived or already-real) selfRating
  }
  legacy++;
  return { ...g, selfRating: deriveFromAttributes(g) };
});

const result = input.groups ? { ...input, groups: out } : out;
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(
  `Merged ${out.length} groups: ${real} from registration (real), ${kept} kept existing, ${legacy} legacy-derived from attributes.`,
);
console.log(`Wrote → ${outPath}`);
