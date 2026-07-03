// SPDX-License-Identifier: AGPL-3.0-only
//
// Data integrity gate. Run before any data goes live (the update script calls
// this). Exits non-zero on any blocking problem, so bad data can never be
// swapped into the running site.
//
//   node scripts/validate-data.mjs [--groups data/groups.json] [--quiz data/quiz.json]

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const groupsPath = getArg("--groups", "data/groups.json");
const quizPath = getArg("--quiz", "data/quiz.json");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let groups, quiz;
try {
  groups = JSON.parse(readFileSync(groupsPath, "utf8")).groups;
  quiz = JSON.parse(readFileSync(quizPath, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse data files: ${e.message}`);
  process.exit(2);
}

const itemIds = quiz.items.map((i) => i.id);
const itemIdSet = new Set(itemIds);
const filterAttrs = new Set(quiz.filters.options.map((o) => o.attribute));

if (!Array.isArray(groups) || groups.length === 0) err("groups[] is empty");
if (itemIds.length === 0) err("quiz.items[] is empty");

const slugs = new Set();
for (const g of groups) {
  const where = g.slug || g.name || "<unknown>";
  for (const field of ["id", "name", "slug", "shortDescription", "categoryName"]) {
    if (!g[field]) err(`${where}: missing required field "${field}"`);
  }
  if (g.slug) {
    if (slugs.has(g.slug)) err(`duplicate slug: ${g.slug}`);
    slugs.add(g.slug);
  }
  if (!g.categoryColor) warn(`${where}: categoryColor missing (UI falls back to grey)`);
  if (!g.longDescription) warn(`${where}: longDescription empty`);
  if (!g.websiteUrl && !g.instagramUrl && !g.contactEmail)
    warn(`${where}: no contact links at all`);

  const sr = g.selfRating;
  if (!sr || !Array.isArray(sr.answers)) {
    err(`${where}: missing selfRating.answers (no matching data!)`);
    continue;
  }
  const answered = new Set();
  for (const a of sr.answers) {
    if (!itemIdSet.has(a.itemId)) err(`${where}: selfRating references unknown item "${a.itemId}"`);
    if (![-1, 0, 1].includes(a.value)) err(`${where}: answer ${a.itemId} value ${a.value} not in {-1,0,1}`);
    answered.add(a.itemId);
  }
  const missing = itemIds.filter((id) => !answered.has(id));
  if (missing.length) warn(`${where}: selfRating missing ${missing.length} item(s): ${missing.join(",")}`);

  for (const f of sr.filterSelections ?? []) {
    if (!filterAttrs.has(f)) err(`${where}: filterSelection "${f}" is not a known filter attribute`);
  }
}

// Near-duplicate detection: the same group registered/scraped twice shows up
// under two slugs (seen live: kritmed/kritmed-dresden, rotaract-club-dresden/-2,
// two TURAG variants). Exact slugs already error above; this catches the same
// NAME under different slugs. Warning only — the fix belongs in the source
// (deactivate one copy in the admin DB), not in this generated file.
const nameStem = (n) => n.toLowerCase().replace(/dresden|e\.?\s?v\.?/g, "").replace(/[^a-zä-ü]/g, "");
const byStem = new Map();
for (const g of groups) {
  const k = nameStem(g.name || "");
  if (!k) continue;
  if (!byStem.has(k)) byStem.set(k, []);
  byStem.get(k).push(g.slug);
}
for (const [stem, list] of byStem) {
  if (list.length > 1)
    warn(`possible duplicate group ("${stem}"): ${list.join(" + ")} — deactivate one copy in the admin DB`);
}

console.log(`Checked ${groups.length} groups against ${itemIds.length} quiz items.`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} ERROR(S):`);
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.error("\nValidation FAILED — data not safe to publish.");
  process.exit(1);
}
console.log("\n✓ Validation passed — data is safe to publish.");
