// SPDX-License-Identifier: AGPL-3.0-only
//
// Calibrate the keyword rules: run the classifier on the verified groups'
// descriptions and compare predicted attributes to the real ones. Honest
// recall/precision per attribute so we know where auto-scraping is weak.
//
//   node scripts/scrape-eval.mjs [--in data/groups.json]

import { readFileSync } from "node:fs";
import { classify } from "./scrape-rules.mjs";

const inPath = process.argv.includes("--in")
  ? process.argv[process.argv.indexOf("--in") + 1]
  : "data/groups.json";
const G = JSON.parse(readFileSync(inPath, "utf8")).groups;
const ATTRS = Object.keys(G[0].attributes);
const stat = Object.fromEntries(ATTRS.map((a) => [a, { tp: 0, fp: 0, fn: 0, tn: 0 }]));
let exact = 0, total = 0;

for (const g of G) {
  const text = [g.name, g.shortDescription, g.longDescription, g.motto].filter(Boolean).join(" ");
  const c = classify(text);
  for (const a of ATTRS) {
    const pred = c.attributes[a], real = g.attributes[a];
    if (pred && real) stat[a].tp++;
    else if (pred && !real) stat[a].fp++;
    else if (!pred && real) stat[a].fn++;
    else stat[a].tn++;
    total++;
    if (pred === real) exact++;
  }
}

console.log("Per-attribute (predicted-from-text vs real), by recall:");
const rows = ATTRS.map((a) => {
  const s = stat[a];
  return { a, prec: s.tp / (s.tp + s.fp) || 0, rec: s.tp / (s.tp + s.fn) || 0, real: s.tp + s.fn, fp: s.fp };
});
for (const r of rows.sort((x, y) => y.rec - x.rec)) {
  console.log(
    `  ${r.a.padEnd(24)} recall ${(r.rec * 100).toFixed(0).padStart(3)}%  prec ${(r.prec * 100)
      .toFixed(0)
      .padStart(3)}%  (real=${r.real}, falsePos=${r.fp})`,
  );
}
console.log(`\nOverall per-cell accuracy: ${(exact / total * 100).toFixed(0)}% (${exact}/${total})`);
console.log("Note: accuracy is inflated by sparse attributes; recall is the honest signal.");
