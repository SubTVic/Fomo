#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
//
// Groups (registration, data/working-set-v2.json) and students (public site,
// static-site/data/quiz.json) must answer exactly the same items, or matching
// compares apples with oranges. This check fails (exit 1) on any difference in
// item IDs, order, texts, short titles, matching attributes or filters.
//
//   node scripts/check-items-sync.mjs [<working-set.json> <quiz.json>]

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** List of human-readable differences (German, like the other data checks). */
export function compareItemSets(ws, quiz) {
  const problems = [];
  const wsIds = ws.items.map((i) => i.id);
  const quizIds = quiz.items.map((i) => i.id);
  if (!same(wsIds, quizIds)) {
    problems.push(`Item-IDs/Reihenfolge verschieden:\n    Registrierung: ${wsIds.join(",")}\n    Website:       ${quizIds.join(",")}`);
  }
  const quizById = new Map(quiz.items.map((i) => [i.id, i]));
  for (const item of ws.items) {
    const other = quizById.get(item.id);
    if (!other) continue;
    for (const field of ["text", "shortTitle", "attributes"]) {
      if (!same(item[field], other[field])) {
        problems.push(`${item.id}: Feld "${field}" verschieden\n    Registrierung: ${JSON.stringify(item[field])}\n    Website:       ${JSON.stringify(other[field])}`);
      }
    }
  }
  const pick = (o) => ({ id: o.id, label: o.label, attribute: o.attribute });
  const wsFilters = ws.filters.options.map(pick);
  const quizFilters = quiz.filters.options.map(pick);
  if (!same(wsFilters, quizFilters)) {
    problems.push(`Filter (ID/Label/Attribut/Reihenfolge) verschieden:\n    Registrierung: ${JSON.stringify(wsFilters)}\n    Website:       ${JSON.stringify(quizFilters)}`);
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [wsPath, quizPath] = [
    process.argv[2] ?? path.join(ROOT, "data/working-set-v2.json"),
    process.argv[3] ?? path.join(ROOT, "static-site/data/quiz.json"),
  ];
  const read = (p) => JSON.parse(readFileSync(p, "utf8"));
  const problems = compareItemSets(read(wsPath), read(quizPath));
  if (problems.length > 0) {
    console.error(`✖ Quiz-Items nicht synchron (${problems.length}):`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error(
      "\nBeide Dateien gemeinsam ändern: data/working-set-v2.json (Registrierung) und " +
        "static-site/data/quiz.json (Website). Siehe docs/runbooks/07-quiz-item-aendern.md.",
    );
    process.exit(1);
  }
  console.log("✓ Quiz-Items synchron (Registrierung = Website).");
}
