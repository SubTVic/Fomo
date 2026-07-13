// SPDX-License-Identifier: AGPL-3.0-only
//
// §5.1 Self-Recognition Test
// Checks if group members' quiz answers rank their own group in the top results.
//
// Usage:
//   npx tsx scripts/validation/self-recognition-test.ts
//   npx tsx scripts/validation/self-recognition-test.ts --input data/archives/pilot-responses-2026-05-04.json
//   npx tsx scripts/validation/self-recognition-test.ts --verbose

import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_INPUT = path.join(REPO_ROOT, "data/archives/pilot-responses-2026-05-04.json");
const PROFILES_FILE = path.join(REPO_ROOT, "data/hsg-profiles-scraped.json");
const WORKING_SET_FILE = path.join(REPO_ROOT, "data/working-set-v1.json");

const BOOL_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports",
  "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
  "international", "beginnerFriendly", "competitive", "financialCost",
  "leadershipOpportunities",
];

// ─── Types ───────────────────────────────────────────────────

interface PilotAnswer {
  questionId: string; // e.g. "D1Q1"
  value: string;      // "1" | "3" | "5"
}

interface PilotSession {
  id: string;
  isMember: string | null;
  groupNames: string | null;
  answers: PilotAnswer[];
}

interface WsItem {
  id: string;
  pilotQuestionId: string | null;
  attributes: { attribute: string; isInverse: boolean }[];
}

interface Profile {
  id: string;
  name: string;
  attributes: Record<string, boolean | string | null>;
}

interface ThesisData {
  id: string;
  attributes: { attribute: string; isInverse: boolean }[];
}

interface GroupData {
  id: string;
  name: string;
  slug: string;
  attributes: Record<string, boolean>;
}

// ─── Matching (inline — mirrors src/lib/quiz/matching.ts) ────

function normalizeAnswer(raw: string | undefined): number | null {
  if (raw === undefined || raw === "0") return null;
  const num = parseInt(raw, 10);
  if (isNaN(num)) return null;
  return (num - 1) / 4; // 1→0.0, 3→0.5, 5→1.0
}

function computeAttributeWeights(groups: GroupData[]): Record<string, number> {
  const n = groups.length;
  if (n === 0) return {};
  const weights: Record<string, number> = {};
  const attrs = Object.keys(groups[0].attributes);
  for (const attr of attrs) {
    const yes = groups.filter((g) => g.attributes[attr] === true).length;
    const no = n - yes;
    weights[attr] = (Math.min(yes, no) / n) * 2;
  }
  return weights;
}

// A1 fix: mirrors src/lib/quiz/matching.ts — see CLAUDE-pläne/archiv/FOMO-Algorithmus-Fixes-Plan.md
function computeItemCountsPerAttribute(theses: ThesisData[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const thesis of theses) {
    for (const mapping of thesis.attributes) {
      counts[mapping.attribute] = (counts[mapping.attribute] ?? 0) + 1;
    }
  }
  return counts;
}

function computeScore(
  answers: Record<string, string>,
  theses: ThesisData[],
  group: GroupData,
  attrWeights: Record<string, number>,
  itemCounts: Record<string, number>,
): number {
  let weightSum = 0;
  let scoreSum = 0;

  for (const thesis of theses) {
    const normalized = normalizeAnswer(answers[thesis.id]);
    if (normalized === null) continue;

    const userWeight = Math.abs(normalized - 0.5) * 2;
    if (userWeight < 0.001) continue;

    for (const mapping of thesis.attributes) {
      const groupAttr = group.attributes[mapping.attribute];
      if (groupAttr === undefined) continue;

      const attrWeight = attrWeights[mapping.attribute] ?? 1;
      const itemCount = itemCounts[mapping.attribute] ?? 1;
      const effectiveWeight = userWeight * attrWeight * (1 / itemCount);
      const groupVal = groupAttr ? 1 : 0;
      const effectiveUser = mapping.isInverse ? 1 - normalized : normalized;
      const similarity = 1 - Math.abs(effectiveUser - groupVal);

      weightSum += effectiveWeight;
      scoreSum += effectiveWeight * similarity;
    }
  }

  return weightSum > 0 ? (scoreSum / weightSum) * 100 : 50;
}

function rankGroups(
  answers: Record<string, string>,
  theses: ThesisData[],
  groups: GroupData[],
): GroupData[] {
  const attrWeights = computeAttributeWeights(groups);
  const itemCounts = computeItemCountsPerAttribute(theses);
  const scored = groups.map((g) => ({ group: g, score: computeScore(answers, theses, g, attrWeights, itemCounts) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.group);
}

// ─── Name matching ───────────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .replace(/e\.\s*v\.?/gi, "ev")
    .replace(/[^a-z0-9äöüß ]/g, "")
    .trim();
}

function findGroupByName(name: string, groups: GroupData[]): GroupData | null {
  const needle = normalizeName(name);
  // Exact
  for (const g of groups) {
    if (normalizeName(g.name) === needle) return g;
  }
  // Substring (needle in group name or vice versa)
  for (const g of groups) {
    const gn = normalizeName(g.name);
    if (gn.includes(needle) || needle.includes(gn)) return g;
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const inputFile = inputIdx >= 0 ? path.resolve(args[inputIdx + 1]) : DEFAULT_INPUT;
  const verbose = args.includes("--verbose");

  // Load files
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input nicht gefunden: ${inputFile}`);
    process.exit(1);
  }
  if (!fs.existsSync(PROFILES_FILE)) {
    console.error(`❌ Profiles nicht gefunden: ${PROFILES_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(WORKING_SET_FILE)) {
    console.error(`❌ Working Set nicht gefunden: ${WORKING_SET_FILE}`);
    process.exit(1);
  }

  const sessions: PilotSession[] = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  const rawProfiles: Profile[] = JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
  const workingSet: { items: WsItem[] } = JSON.parse(fs.readFileSync(WORKING_SET_FILE, "utf-8"));

  console.log(`📂 ${sessions.length} Sessions geladen`);

  if (sessions.length === 0) {
    console.error(
      "\n⚠️  Keine Pilot-Sessions im Archiv. Exportiere zuerst die Daten aus der Prod-DB:\n" +
      "   DATABASE_URL=<prod-url> npx tsx scripts/export-pilot-data.ts\n" +
      "   (Die 67 echten Sessions liegen nur in der Vercel PostgreSQL-DB)"
    );
    process.exit(0);
  }

  // Build pilotQuestionId → WS thesis ID map
  const pilotToWs = new Map<string, string>();
  for (const item of workingSet.items) {
    if (item.pilotQuestionId) pilotToWs.set(item.pilotQuestionId, item.id);
  }

  // Build ThesisData[]
  const theses: ThesisData[] = workingSet.items.map((item) => ({
    id: item.id,
    attributes: item.attributes,
  }));

  // Build GroupData[] (boolean attrs only)
  const groups: GroupData[] = rawProfiles.map((p) => {
    const boolAttrs: Record<string, boolean> = {};
    for (const attr of BOOL_ATTRS) {
      const val = p.attributes[attr];
      if (typeof val === "boolean") boolAttrs[attr] = val;
    }
    return {
      id: p.id,
      name: p.name,
      slug: p.id,
      attributes: boolAttrs,
    };
  });

  console.log(`📊 ${groups.length} Gruppen, ${theses.length} WS-Thesen\n`);

  // Filter: members who named their group
  const memberSessions = sessions.filter(
    (s) => (s.isMember === "yes" || s.isMember === "was") && s.groupNames?.trim()
  );

  console.log(`🎯 ${memberSessions.length} Mitglieder-Sessions mit Gruppenangabe\n`);

  if (memberSessions.length === 0) {
    console.error("❌ Keine auswertbaren Sessions (isMember=yes/was + groupNames)");
    process.exit(0);
  }

  // Run test
  let evaluated = 0;
  let skipped = 0;
  const hitTop1: string[] = [];
  const hitTop3: string[] = [];
  const hitTop10: string[] = [];
  const reciprocalRanks: number[] = [];

  const perGroupHits: Record<string, { top1: number; top3: number; top10: number; total: number }> = {};

  for (const session of memberSessions) {
    // Remap answers from pilotQuestionId → WS id
    const wsAnswers: Record<string, string> = {};
    for (const answer of session.answers) {
      const wsId = pilotToWs.get(answer.questionId);
      if (wsId) wsAnswers[wsId] = answer.value;
    }

    const nonNeutral = Object.values(wsAnswers).filter((v) => v === "1" || v === "5").length;
    if (nonNeutral < 3) {
      skipped++;
      continue;
    }

    // Parse group names (comma-separated)
    const namedGroups = (session.groupNames ?? "")
      .split(/[,;\/]/)
      .map((n) => n.trim())
      .filter(Boolean);

    const resolved = namedGroups
      .map((n) => findGroupByName(n, groups))
      .filter((g): g is GroupData => g !== null);

    if (resolved.length === 0) {
      if (verbose) {
        console.log(`  [SKIP] Keine Gruppe gefunden: "${session.groupNames}"`);
      }
      skipped++;
      continue;
    }

    const ranked = rankGroups(wsAnswers, theses, groups);
    evaluated++;

    // Check rank of each named group (best rank counts)
    let bestRank = Infinity;
    for (const group of resolved) {
      const rank = ranked.findIndex((g) => g.id === group.id) + 1;
      if (rank > 0 && rank < bestRank) bestRank = rank;

      // Per-group stats
      if (!perGroupHits[group.name]) {
        perGroupHits[group.name] = { top1: 0, top3: 0, top10: 0, total: 0 };
      }
      perGroupHits[group.name].total++;
      if (rank === 1) perGroupHits[group.name].top1++;
      if (rank <= 3) perGroupHits[group.name].top3++;
      if (rank <= 10) perGroupHits[group.name].top10++;
    }

    if (bestRank === Infinity) {
      skipped++;
      continue;
    }

    reciprocalRanks.push(1 / bestRank);
    if (bestRank === 1) hitTop1.push(session.id);
    if (bestRank <= 3) hitTop3.push(session.id);
    if (bestRank <= 10) hitTop10.push(session.id);

    if (verbose) {
      const groupNames = resolved.map((g) => g.name).join(", ");
      const top5 = ranked.slice(0, 5).map((g, i) => `${i + 1}. ${g.name}`).join(" | ");
      const hit = bestRank <= 3 ? "✅" : bestRank <= 10 ? "⚠️ " : "❌";
      console.log(`${hit} Rank ${bestRank} | ${groupNames}`);
      console.log(`   Top 5: ${top5}`);
    }
  }

  const n = evaluated;
  const mrr = reciprocalRanks.length > 0
    ? reciprocalRanks.reduce((a, b) => a + b, 0) / n
    : 0;

  console.log("=".repeat(55));
  console.log(`§5.1 Self-Recognition Test — Ergebnisse`);
  console.log("=".repeat(55));
  console.log(`  Auswertbar:   ${n} Sessions  (${skipped} übersprungen)`);
  console.log(`  Top-1:        ${hitTop1.length}/${n}  (${pct(hitTop1.length, n)}%)`);
  console.log(`  Top-3:        ${hitTop3.length}/${n}  (${pct(hitTop3.length, n)}%)`);
  console.log(`  Top-10:       ${hitTop10.length}/${n}  (${pct(hitTop10.length, n)}%)`);
  console.log(`  MRR:          ${mrr.toFixed(3)}`);
  console.log("=".repeat(55));

  // Benchmarks
  const random1 = (1 / groups.length * 100).toFixed(1);
  const random3 = (3 / groups.length * 100).toFixed(1);
  const random10 = (10 / groups.length * 100).toFixed(1);
  console.log(`\n  Zufalls-Baseline (${groups.length} Gruppen):`);
  console.log(`  Top-1: ${random1}% | Top-3: ${random3}% | Top-10: ${random10}%`);

  // Per-group breakdown
  const groupsSorted = Object.entries(perGroupHits).sort((a, b) => b[1].total - a[1].total);
  if (groupsSorted.length > 0) {
    console.log(`\n  Pro-Gruppe:`);
    for (const [name, hits] of groupsSorted) {
      const t1 = pct(hits.top1, hits.total);
      const t3 = pct(hits.top3, hits.total);
      const t10 = pct(hits.top10, hits.total);
      console.log(`  ${name.slice(0, 35).padEnd(36)} n=${hits.total}  Top1:${t1}%  Top3:${t3}%  Top10:${t10}%`);
    }
  }
}

function pct(n: number, total: number): string {
  if (total === 0) return "—";
  return ((n / total) * 100).toFixed(0);
}

main();
