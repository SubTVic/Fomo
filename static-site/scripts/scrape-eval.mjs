// SPDX-License-Identifier: AGPL-3.0-only
//
// Calibrate the scraper for the NEW (attribute-free) version: run the text
// classifier on the verified groups' descriptions and compare the directly
// produced item answers + filterSelections to their real selfRating.
//
// The decisive metric is mean-absolute-error vs the true profile (that is what
// the matcher uses). Lower is better; the all-neutral baseline is the bar to
// beat without ever doing harm.
//
//   node scripts/scrape-eval.mjs [--in data/groups.json]

import { readFileSync } from "node:fs";
import { classifyToSelfRating } from "./scrape-rules.mjs";

const inPath = process.argv.includes("--in")
  ? process.argv[process.argv.indexOf("--in") + 1]
  : "data/groups.json";
const G = JSON.parse(readFileSync(inPath, "utf8")).groups;
const Q = JSON.parse(readFileSync("data/quiz.json", "utf8"));

let tot = 0, agree = 0, wrong = 0, neutral = 0;
let absErr = 0, cells = 0, neutralErr = 0;
let fTP = 0, fFP = 0, fFN = 0;

for (const g of G) {
  const text = [g.name, g.shortDescription, g.longDescription, g.motto].filter(Boolean).join(" ");
  const c = classifyToSelfRating(text, Q.items, Q.filters);
  const pred = Object.fromEntries(c.answers.map((a) => [a.itemId, a.value]));
  const real = Object.fromEntries(g.selfRating.answers.map((a) => [a.itemId, a.value]));

  for (const it of Q.items) {
    const rv = real[it.id] ?? 0;
    const pv = pred[it.id] ?? 0;
    absErr += Math.abs(pv - rv);
    neutralErr += Math.abs(0 - rv);
    cells++;
    if (rv !== 0) {
      tot++;
      if (pv !== 0 && pv > 0 === rv > 0) agree++;
      else if (pv !== 0) wrong++;
      else neutral++;
    }
  }
  const realF = new Set(g.selfRating.filterSelections || []);
  const predF = new Set(c.filterSelections);
  for (const f of predF) (realF.has(f) ? fTP++ : fFP++);
  for (const f of realF) if (!predF.has(f)) fFN++;
}

console.log("Direct item-answer scraping vs real selfRating (text = descriptions only → pessimistic):\n");
console.log("Mean abs error vs true profile (0=perfect, 2=worst, lower=better match):");
console.log(`  all-neutral baseline : ${(neutralErr / cells).toFixed(3)}`);
console.log(`  scraper              : ${(absErr / cells).toFixed(3)}   (never worse than neutral by design)`);
console.log("\nAmong the group's non-neutral real answers:");
console.log(`  scraper agrees  : ${(agree / tot * 100).toFixed(0)}%`);
console.log(`  scraper wrong   : ${(wrong / tot * 100).toFixed(0)}%   (costly — kept low on purpose)`);
console.log(`  scraper neutral : ${(neutral / tot * 100).toFixed(0)}%   (safe; shrinks with full page text)`);
console.log(`\nfilterSelections: recall ${(fTP / (fTP + fFN) * 100).toFixed(0)}%  precision ${(fTP / (fTP + fFP) * 100).toFixed(0)}%`);
