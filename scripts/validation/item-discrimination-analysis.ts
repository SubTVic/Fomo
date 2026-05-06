// SPDX-License-Identifier: AGPL-3.0-only
//
// §D1 Item-Discrimination-Analysis
// Checks empirically whether each working-set item separates members
// of attribute=true groups from members of attribute=false groups.
//
// Usage:
//   npx tsx scripts/validation/item-discrimination-analysis.ts
//   npx tsx scripts/validation/item-discrimination-analysis.ts --verbose
//   npx tsx scripts/validation/item-discrimination-analysis.ts --output data/item-empirical-validity-report.md

import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_PILOT = path.join(REPO_ROOT, "data/archives/pilot-responses-2026-05-04.json");
const PROFILES_FILE = path.join(REPO_ROOT, "data/hsg-profiles-scraped.json");
const WORKING_SET_FILE = path.join(REPO_ROOT, "data/working-set-v1.json");

const BOOL_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports",
  "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
  "international", "beginnerFriendly", "competitive", "financialCost",
  "leadershipOpportunities",
];

// ─── Types ──────────────────────────────────────────────────────────���────────

interface PilotAnswer {
  questionId: string;
  value: string;
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
  text: string;
  shortTitle: string;
  attributes: { attribute: string; isInverse: boolean }[];
}

interface Profile {
  id: string;
  name: string;
  attributes: Record<string, boolean | string | null>;
}

// ─── Name matching ────────────────────────────────────────────────────────────

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

function findProfileByName(name: string, profiles: Profile[]): Profile | null {
  const needle = normalizeName(name);
  for (const p of profiles) {
    if (normalizeName(p.name) === needle) return p;
  }
  for (const p of profiles) {
    const pn = normalizeName(p.name);
    if (pn.includes(needle) || needle.includes(pn)) return p;
  }
  return null;
}

// ─── Answer normalization ─────────────────────────────────────────────────────

function normalizeAnswer(raw: string | undefined): number | null {
  if (raw === undefined || raw === "0") return null;
  const num = parseInt(raw, 10);
  if (isNaN(num)) return null;
  return (num - 1) / 4; // 1→0.0, 3→0.5, 5→1.0
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function tStatistic(groupA: number[], groupB: number[]): number | null {
  if (groupA.length < 2 || groupB.length < 2) return null;
  const mA = mean(groupA);
  const mB = mean(groupB);
  const varA = groupA.reduce((s, v) => s + (v - mA) ** 2, 0) / (groupA.length - 1);
  const varB = groupB.reduce((s, v) => s + (v - mB) ** 2, 0) / (groupB.length - 1);
  const se = Math.sqrt(varA / groupA.length + varB / groupB.length);
  if (se < 1e-9) return null;
  return (mA - mB) / se;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx >= 0 ? path.resolve(args[outputIdx + 1]) : null;

  if (!fs.existsSync(DEFAULT_PILOT)) {
    console.error(
      `❌ Pilot-Daten nicht gefunden: ${DEFAULT_PILOT}\n` +
      `   Exportiere zuerst: DATABASE_URL=<prod> npx tsx scripts/export-pilot-data.ts`
    );
    process.exit(1);
  }

  const sessions: PilotSession[] = JSON.parse(fs.readFileSync(DEFAULT_PILOT, "utf-8"));
  const rawProfiles: Profile[] = JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
  const workingSet: { items: WsItem[] } = JSON.parse(fs.readFileSync(WORKING_SET_FILE, "utf-8"));

  // Build pilotQuestionId → WS item map
  const wsItemByPilotId = new Map<string, WsItem>();
  for (const item of workingSet.items) {
    if (item.pilotQuestionId) wsItemByPilotId.set(item.pilotQuestionId, item);
  }

  // Filter to member sessions with group names
  const memberSessions = sessions.filter(
    (s) => (s.isMember === "yes" || s.isMember === "was") && s.groupNames?.trim()
  );

  console.log(`📂 ${sessions.length} Sessions total, ${memberSessions.length} Mitglieder mit Gruppenangabe\n`);

  if (memberSessions.length === 0) {
    console.error("❌ Keine auswertbaren Sessions.");
    process.exit(0);
  }

  // Build per-session: resolved profile(s) + WS answers
  type ResolvedSession = {
    sessionId: string;
    profiles: Profile[];
    wsAnswers: Record<string, number>; // wsItemId → normalized value
  };

  const resolved: ResolvedSession[] = [];
  let skipped = 0;

  for (const session of memberSessions) {
    const names = (session.groupNames ?? "")
      .split(/[,;\/]/)
      .map((n) => n.trim())
      .filter(Boolean);

    const profiles = names
      .map((n) => findProfileByName(n, rawProfiles))
      .filter((p): p is Profile => p !== null);

    if (profiles.length === 0) {
      if (verbose) console.log(`  [SKIP] Keine Gruppe gefunden: "${session.groupNames}"`);
      skipped++;
      continue;
    }

    const wsAnswers: Record<string, number> = {};
    for (const answer of session.answers) {
      const wsItem = wsItemByPilotId.get(answer.questionId);
      if (!wsItem) continue;
      const norm = normalizeAnswer(answer.value);
      if (norm !== null) wsAnswers[wsItem.id] = norm;
    }

    resolved.push({ sessionId: session.id, profiles, wsAnswers });
  }

  console.log(`✅ ${resolved.length} Sessions auswertbar (${skipped} übersprungen)\n`);

  // Per item: collect answers split by whether the user's group has attribute=true or false
  type ItemResult = {
    wsItem: WsItem;
    trueGroup: number[];   // normalized answers from members of attribute=true groups
    falseGroup: number[];  // normalized answers from members of attribute=false groups
  };

  const itemResults = new Map<string, ItemResult>();
  for (const wsItem of workingSet.items) {
    itemResults.set(wsItem.id, { wsItem, trueGroup: [], falseGroup: [] });
  }

  for (const session of resolved) {
    for (const [wsId, normAnswer] of Object.entries(session.wsAnswers)) {
      const result = itemResults.get(wsId);
      if (!result) continue;

      const wsItem = result.wsItem;

      for (const mapping of wsItem.attributes) {
        // Check if the user's group has this attribute
        for (const profile of session.profiles) {
          const attrVal = profile.attributes[mapping.attribute];
          if (typeof attrVal !== "boolean") continue;

          // Apply inverse: if isInverse, flip the answer for comparison
          const effectiveAnswer = mapping.isInverse ? 1 - normAnswer : normAnswer;

          if (attrVal === true) {
            result.trueGroup.push(effectiveAnswer);
          } else {
            result.falseGroup.push(effectiveAnswer);
          }
        }
      }
    }
  }

  // Build result table sorted by discrimination power (desc)
  type Row = {
    wsItem: WsItem;
    meanTrue: number;
    meanFalse: number;
    discrimination: number;
    nTrue: number;
    nFalse: number;
    tStat: number | null;
    verdict: "gut" | "schwach" | "keine Daten";
  };

  const rows: Row[] = [];
  for (const result of itemResults.values()) {
    const mt = mean(result.trueGroup);
    const mf = mean(result.falseGroup);
    const disc = isNaN(mt) || isNaN(mf) ? NaN : mt - mf;
    const tStat = tStatistic(result.trueGroup, result.falseGroup);
    const verdict: Row["verdict"] =
      isNaN(disc) ? "keine Daten" :
      Math.abs(disc) >= 0.15 ? "gut" : "schwach";

    rows.push({
      wsItem: result.wsItem,
      meanTrue: mt,
      meanFalse: mf,
      discrimination: disc,
      nTrue: result.trueGroup.length,
      nFalse: result.falseGroup.length,
      tStat,
      verdict,
    });
  }

  rows.sort((a, b) => {
    if (isNaN(a.discrimination) && isNaN(b.discrimination)) return 0;
    if (isNaN(a.discrimination)) return 1;
    if (isNaN(b.discrimination)) return -1;
    return b.discrimination - a.discrimination;
  });

  // Console output
  console.log("=".repeat(70));
  console.log("D1 — Item-Diskriminierungsanalyse");
  console.log("=".repeat(70));
  console.log(`${"Item".padEnd(14)} ${"Attr".padEnd(22)} ${"µ(true)".padStart(8)} ${"µ(false)".padStart(9)} ${"Δ".padStart(7)} ${"n+".padStart(4)} ${"n-".padStart(4)}  Urteil`);
  console.log("-".repeat(70));

  for (const row of rows) {
    const attr = row.wsItem.attributes[0]?.attribute ?? "?";
    const mt = isNaN(row.meanTrue) ? "  —  " : row.meanTrue.toFixed(3);
    const mf = isNaN(row.meanFalse) ? "  —  " : row.meanFalse.toFixed(3);
    const disc = isNaN(row.discrimination) ? "  —  " : row.discrimination.toFixed(3);
    const icon = row.verdict === "gut" ? "✅" : row.verdict === "schwach" ? "⚠️ " : "❓";
    console.log(
      `${row.wsItem.id.padEnd(14)} ${attr.padEnd(22)} ${mt.padStart(8)} ${mf.padStart(9)} ${disc.padStart(7)} ${String(row.nTrue).padStart(4)} ${String(row.nFalse).padStart(4)}  ${icon}`
    );
  }

  console.log("=".repeat(70));
  console.log(`\n⚠️  DISCLAIMER: n=${resolved.length} (sehr klein). Alle Befunde sind Hinweise, keine Belege.\n`);

  // Markdown report
  if (outputFile) {
    const lines: string[] = [
      "# D1 — Item-Empirische-Validitäts-Report",
      `Stand: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "## Methode",
      "",
      `- **Datenbasis:** ${resolved.length} Mitglieder-Sessions aus Pilot (${sessions.length} total)`,
      `- **Übersprungen:** ${skipped} (Gruppe nicht in Profil-DB gefunden)`,
      "- **Diskriminierungskraft:** Differenz der mittleren Antworten von Mitgliedern in Gruppen",
      "  mit `attribute=true` vs. `attribute=false`",
      "- **Grenzwert:** |Δ| ≥ 0.15 = 'gut', darunter = 'schwach'",
      "",
      "> **Disclaimer:** n=" + resolved.length + " ist sehr klein. Alle Befunde sind Hinweise, keine statistischen Belege.",
      "> t-Test-Werte ohne Signifikanzkorrektur (keine Power für Bonferroni bei n=" + resolved.length + ").",
      "",
      "## Ergebnisse",
      "",
      "| Item | ShortTitle | Attribut | µ(attr=true) | µ(attr=false) | Δ | n+ | n- | t | Urteil |",
      "|---|---|---|---|---|---|---|---|---|---|",
    ];

    for (const row of rows) {
      const attr = row.wsItem.attributes[0]?.attribute ?? "?";
      const mt = isNaN(row.meanTrue) ? "—" : row.meanTrue.toFixed(3);
      const mf = isNaN(row.meanFalse) ? "—" : row.meanFalse.toFixed(3);
      const disc = isNaN(row.discrimination) ? "—" : row.discrimination.toFixed(3);
      const tStr = row.tStat == null ? "—" : row.tStat.toFixed(2);
      const verdict = row.verdict === "gut" ? "✅ gut" : row.verdict === "schwach" ? "⚠️ schwach" : "❓ keine Daten";
      lines.push(`| ${row.wsItem.id} | ${row.wsItem.shortTitle} | ${attr} | ${mt} | ${mf} | ${disc} | ${row.nTrue} | ${row.nFalse} | ${tStr} | ${verdict} |`);
    }

    // Problematic items section
    const problematic = rows.filter((r) => r.verdict === "schwach" && !isNaN(r.discrimination));
    if (problematic.length > 0) {
      lines.push("", "## Problematische Items (schwache Diskriminierung)", "");
      for (const row of problematic) {
        const attr = row.wsItem.attributes[0]?.attribute ?? "?";
        lines.push(`### ${row.wsItem.id} — "${row.wsItem.shortTitle}"`);
        lines.push("");
        lines.push(`- **Text:** "${row.wsItem.text}"`);
        lines.push(`- **Mapping:** \`${attr}\` (isInverse: ${row.wsItem.attributes[0]?.isInverse ?? false})`);
        lines.push(`- **Δ:** ${row.discrimination.toFixed(3)} (n+=${row.nTrue}, n-=${row.nFalse})`);
        lines.push(`- **Handlungsempfehlung:** prüfen ob Item wirklich \`${attr}\` misst oder ob Wording überarbeitet werden sollte`);
        lines.push("");
      }
    }

    const noData = rows.filter((r) => r.verdict === "keine Daten");
    if (noData.length > 0) {
      lines.push("## Items ohne Datenbasis", "");
      lines.push("Für diese Items gibt es keine Mitglieder-Sessions aus Gruppen mit bekanntem Attribut-Wert:");
      lines.push("");
      for (const row of noData) {
        lines.push(`- **${row.wsItem.id}** (${row.wsItem.shortTitle}) → Attribut: ${row.wsItem.attributes[0]?.attribute ?? "?"}`);
      }
      lines.push("");
    }

    fs.writeFileSync(outputFile, lines.join("\n") + "\n", "utf-8");
    console.log(`📝 Report geschrieben nach: ${outputFile}`);
  }
}

main();
