// SPDX-License-Identifier: AGPL-3.0-only
//
// Data integrity gate. Runs before every build (npm "prebuild") and in the
// update script. Exits non-zero on any blocking problem, so bad data can never
// go live.
//
//   node scripts/validate-data.mjs [--groups data/groups.json] [--quiz data/quiz.json]
//                                  [--categories data/categories.json]
//                                  [--translations data/group-translations.json]

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const groupsPath = getArg("--groups", "data/groups.json");
const quizPath = getArg("--quiz", "data/quiz.json");
const categoriesPath = getArg("--categories", "data/categories.json");
const translationsPath = getArg("--translations", "data/group-translations.json");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let groups, quiz, categories, translations;
try {
  groups = JSON.parse(readFileSync(groupsPath, "utf8")).groups;
  quiz = JSON.parse(readFileSync(quizPath, "utf8"));
  categories = JSON.parse(readFileSync(categoriesPath, "utf8")).categories;
  translations = JSON.parse(readFileSync(translationsPath, "utf8")).translations;
} catch (e) {
  console.error(`FEHLER: Datendateien nicht lesbar (kaputtes JSON?): ${e.message}`);
  process.exit(2);
}

const itemIds = quiz.items.map((i) => i.id);
const itemIdSet = new Set(itemIds);
const filterAttrs = new Set(quiz.filters.options.map((o) => o.attribute));
const categoryNames = new Set(categories.map((c) => c.name));

/** Absolute http(s) URL with a dotted host, e.g. https://verein.de/x */
function isHttpUrl(value) {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    return new URL(value).hostname.includes(".");
  } catch {
    return false;
  }
}

if (!Array.isArray(groups) || groups.length === 0) err("groups[] ist leer");
if (itemIds.length === 0) err("quiz.items[] ist leer");

const slugs = new Set();
for (const g of groups) {
  const where = g.slug || g.name || "<unbekannt>";
  const verified = g.selfRating?.derived !== true;
  for (const field of ["id", "name", "slug", "shortDescription", "categoryName"]) {
    if (!g[field]) err(`${where}: Pflichtfeld "${field}" fehlt`);
  }
  if (g.slug) {
    if (slugs.has(g.slug)) err(`Slug doppelt: ${g.slug}`);
    slugs.add(g.slug);
  }
  if (g.categoryName && !categoryNames.has(g.categoryName))
    err(`${where}: unbekannte Kategorie "${g.categoryName}" (bekannt: ${categoriesPath})`);
  if (!g.longDescription) warn(`${where}: lange Beschreibung leer`);
  if (!g.websiteUrl && !g.instagramUrl && !g.contactEmail) warn(`${where}: gar keine Kontaktmöglichkeit`);

  for (const field of ["websiteUrl", "instagramUrl"]) {
    const url = g[field];
    if (!url || isHttpUrl(url)) continue;
    const msg = `${where}: ${field} "${url}" ist kein gültiger Link (muss mit https:// beginnen)`;
    if (verified) err(msg);
    else warn(msg);
  }

  const sr = g.selfRating;
  if (!sr || !Array.isArray(sr.answers)) {
    err(`${where}: selfRating.answers fehlt (keine Matching-Daten!)`);
    continue;
  }
  const answered = new Set();
  for (const a of sr.answers) {
    if (!itemIdSet.has(a.itemId)) err(`${where}: Antwort auf unbekannte Frage "${a.itemId}"`);
    if (![-1, 0, 1].includes(a.value)) err(`${where}: Antwort ${a.itemId} hat Wert ${a.value} (erlaubt: -1, 0, 1)`);
    answered.add(a.itemId);
  }
  const missing = itemIds.filter((id) => !answered.has(id));
  if (missing.length) warn(`${where}: ${missing.length} Frage(n) ohne Antwort: ${missing.join(",")}`);

  for (const f of sr.filterSelections ?? []) {
    if (!filterAttrs.has(f)) err(`${where}: unbekannter Filter "${f}"`);
  }
}

// English translations (data/group-translations.json): flag ones whose German
// source text changed since they were written, and ones for groups that no
// longer exist. Warnings only — the site then still shows the old English text.
function sourceHash(text) {
  return createHash("sha256").update(String(text ?? "").replace(/\s+/g, " ").trim(), "utf8").digest("hex").slice(0, 16);
}
const groupBySlug = new Map(groups.map((g) => [g.slug, g]));
for (const [slug, t] of Object.entries(translations)) {
  const g = groupBySlug.get(slug);
  if (!g) {
    warn(`Übersetzung für unbekannte Gruppe "${slug}" — Eintrag in data/group-translations.json löschen`);
    continue;
  }
  const current = sourceHash(g.longDescription || g.shortDescription);
  if (t.sourceHash !== current) {
    warn(`${slug}: englische Übersetzung veraltet (deutscher Text geändert) — Text prüfen und sourceHash auf "${current}" setzen`);
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
    warn(`mögliches Duplikat ("${stem}"): ${list.join(" + ")} — eine Kopie in der Admin-App deaktivieren`);
}

console.log(`Datenprüfung: ${groups.length} Gruppen, ${itemIds.length} Fragen.`);
if (warnings.length) {
  console.log(`\n${warnings.length} Hinweis(e):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} FEHLER:`);
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.error("\nDatenprüfung FEHLGESCHLAGEN — diese Daten dürfen nicht live gehen.");
  console.error("Korrektur in der Admin-App vornehmen und neu exportieren (nicht groups.json von Hand ändern).");
  process.exit(1);
}
console.log("\n✓ Datenprüfung bestanden.");
