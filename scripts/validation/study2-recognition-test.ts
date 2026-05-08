// SPDX-License-Identifier: AGPL-3.0-only
//
// Studie-2-Validierung: Self-Recognition-Test mit WS2-Items
//
// Liest Study2Session/Answer (Mitglieder) und GroupSelfRating/Answer (Gruppen) aus DB.
// Berechnet MRR, Top-K-Recall und Per-Gruppen-Breakdown.
//
// Primärmetrik: MRR — misst wie weit oben die eigene Gruppe im Schnitt steht.
// Sekundärmetrik: Top-10-Recall — grobe Erfolgsquote ohne harten Cutoff.
//
// Usage:
//   npx tsx scripts/validation/study2-recognition-test.ts
//   npx tsx scripts/validation/study2-recognition-test.ts --verbose
//   npx tsx scripts/validation/study2-recognition-test.ts --min-answers 15

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const verbose = process.argv.includes("--verbose");
const minAnswers = parseInt(
  process.argv.find((a) => a.startsWith("--min-answers="))?.split("=")[1] ?? "10"
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserVector {
  sessionId: string;
  groupId: string;
  groupName: string;
  answers: Record<string, number>; // itemId → -1 | 0 | 1
  filterSelections: string[];
}

interface GroupVector {
  groupId: string;
  groupName: string;
  answers: Record<string, number>; // itemId → -1 | 0 | 1
  filterSelections: string[];
  raterCount: number;
}

// ─── Matching ────────────────────────────────────────────────────────────────

/**
 * V2 match score: mean absolute distance on non-neutral user items.
 * Returns 0–100 (100 = perfect match).
 *
 * Filter logic: if user selected filters AND group has filter selections,
 * require at least one overlap — else score = 0 (hard constraint).
 */
function computeScore(user: UserVector, group: GroupVector): number {
  // Filter hard constraint
  if (user.filterSelections.length > 0 && group.filterSelections.length > 0) {
    const overlap = user.filterSelections.some((f) =>
      group.filterSelections.includes(f)
    );
    if (!overlap) return 0;
  }

  // Only score on items where user is non-neutral
  const activeItems = Object.entries(user.answers).filter(([, v]) => v !== 0);
  if (activeItems.length === 0) return 50;

  const totalDist = activeItems.reduce((sum, [itemId, u]) => {
    const g = group.answers[itemId] ?? 0; // default neutral if group didn't answer
    return sum + Math.abs(u - g);         // max distance per item = 2
  }, 0);

  const maxDist = activeItems.length * 2;
  return Math.round((1 - totalDist / maxDist) * 100);
}

function rankGroups(user: UserVector, groups: GroupVector[]): GroupVector[] {
  return [...groups].sort(
    (a, b) => computeScore(user, b) - computeScore(user, a)
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Load group self-ratings
  const rawGroups = await db.groupSelfRating.findMany({
    include: {
      answers: true,
      group: { select: { id: true, name: true } },
    },
  });

  if (rawGroups.length === 0) {
    console.error("Keine GroupSelfRatings in der DB. Erst Phase-2-Self-Ratings erheben.");
    process.exit(1);
  }

  const groups: GroupVector[] = rawGroups.map((r) => ({
    groupId: r.groupId,
    groupName: r.group.name,
    answers: Object.fromEntries(r.answers.map((a) => [a.itemId, a.value])),
    filterSelections: (r.filterSelections as string[] | null) ?? [],
    raterCount: r.raterCount,
  }));

  console.log(`Gruppen mit Self-Rating: ${groups.length}`);

  // Load member sessions (Study2 — only sessions with linked groupId)
  const rawSessions = await db.study2Session.findMany({
    where: {
      completedAt: { not: null },
      OR: [
        { groupId: { not: null } },
        { groupNameFreeText: { not: null } },
      ],
    },
    include: {
      answers: true,
      group: { select: { id: true, name: true } },
    },
  });

  console.log(`Member-Sessions gesamt: ${rawSessions.length}`);

  // Build user vectors; skip if groupId not in groups (no self-rating)
  const groupIds = new Set(groups.map((g) => g.groupId));
  const users: UserVector[] = [];
  let skippedNoRating = 0;
  let skippedFewAnswers = 0;

  for (const s of rawSessions) {
    const gId = s.groupId;
    const gName = s.group?.name ?? s.groupNameFreeText ?? "Unbekannt";

    if (!gId || !groupIds.has(gId)) {
      skippedNoRating++;
      continue;
    }

    const answers: Record<string, number> = {};
    for (const a of s.answers) {
      answers[a.itemId] = a.value;
    }

    const nonNeutral = Object.values(answers).filter((v) => v !== 0).length;
    if (nonNeutral < minAnswers) {
      skippedFewAnswers++;
      continue;
    }

    users.push({
      sessionId: s.id,
      groupId: gId,
      groupName: gName,
      answers,
      filterSelections: (s.filterSelections as string[] | null) ?? [],
    });
  }

  console.log(
    `Auswertbar: ${users.length}  |  übersprungen: ${skippedNoRating} (Gruppe kein Self-Rating) + ${skippedFewAnswers} (zu wenig Antworten)\n`
  );

  if (users.length === 0) {
    console.error("Keine auswertbaren Sessions. Recruitment nötig.");
    process.exit(1);
  }

  // Evaluate
  const reciprocalRanks: number[] = [];
  const top5Hits: number[] = [];
  const top10Hits: number[] = [];
  const perGroup: Record<
    string,
    { total: number; top5: number; top10: number; ranks: number[] }
  > = {};

  for (const user of users) {
    const ranked = rankGroups(user, groups);
    const rank = ranked.findIndex((g) => g.groupId === user.groupId) + 1;

    if (rank === 0) {
      // Should not happen if filtering is correct
      continue;
    }

    reciprocalRanks.push(1 / rank);
    top5Hits.push(rank <= 5 ? 1 : 0);
    top10Hits.push(rank <= 10 ? 1 : 0);

    if (!perGroup[user.groupName]) {
      perGroup[user.groupName] = { total: 0, top5: 0, top10: 0, ranks: [] };
    }
    perGroup[user.groupName].total++;
    perGroup[user.groupName].ranks.push(rank);
    if (rank <= 5) perGroup[user.groupName].top5++;
    if (rank <= 10) perGroup[user.groupName].top10++;

    if (verbose) {
      const top5Names = ranked.slice(0, 5).map((g, i) => `${i + 1}. ${g.groupName}`).join(" | ");
      const icon = rank <= 5 ? "✅" : rank <= 10 ? "⚠️ " : "❌";
      console.log(`${icon} Rank ${rank.toString().padStart(2)}  |  ${user.groupName}`);
      if (rank > 5) console.log(`   Top 5: ${top5Names}`);
    }
  }

  const n = reciprocalRanks.length;
  const mrr = reciprocalRanks.reduce((a, b) => a + b, 0) / n;
  const top5Pct = (top5Hits.reduce((a, b) => a + b, 0) / n * 100).toFixed(1);
  const top10Pct = (top10Hits.reduce((a, b) => a + b, 0) / n * 100).toFixed(1);
  const medianRank = [...reciprocalRanks.map((r) => Math.round(1 / r))].sort((a, b) => a - b)[Math.floor(n / 2)];
  const randomMrr = (Math.log(groups.length + 1) > 0
    ? Array.from({ length: groups.length }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b) / groups.length
    : 0).toFixed(3);

  console.log("=".repeat(60));
  console.log("Studie-2-Self-Recognition-Test — Ergebnisse");
  console.log("=".repeat(60));
  console.log(`  Sessions:    ${n}  (von ${rawSessions.length} gesamt)`);
  console.log(`  Gruppen:     ${groups.length} mit Self-Rating`);
  console.log("");
  console.log(`  MRR:         ${mrr.toFixed(3)}   ← Primärmetrik`);
  console.log(`  Median Rank: ${medianRank}`);
  console.log(`  Top-5:       ${top5Pct}%`);
  console.log(`  Top-10:      ${top10Pct}%   ← Sekundärmetrik`);
  console.log("");
  console.log(`  Zufalls-Baseline (${groups.length} Gruppen):`);
  console.log(`  MRR ≈ ${randomMrr}  |  Top-5 ≈ ${(5 / groups.length * 100).toFixed(1)}%  |  Top-10 ≈ ${(10 / groups.length * 100).toFixed(1)}%`);
  console.log("");
  console.log(`  Ziel: MRR ≥ 0.30  |  Top-10 ≥ 70%`);
  console.log("=".repeat(60));

  // Per-group breakdown (sorted by n desc)
  const sorted = Object.entries(perGroup).sort((a, b) => b[1].total - a[1].total);
  if (sorted.length > 0) {
    console.log("\n  Pro-Gruppe:");
    for (const [name, s] of sorted) {
      const avgRank = (s.ranks.reduce((a, b) => a + b, 0) / s.total).toFixed(1);
      const t5 = (s.top5 / s.total * 100).toFixed(0).padStart(3);
      const t10 = (s.top10 / s.total * 100).toFixed(0).padStart(3);
      console.log(
        `  ${name.slice(0, 34).padEnd(35)}  n=${String(s.total).padStart(2)}  AvgRank=${avgRank.padStart(4)}  Top5=${t5}%  Top10=${t10}%`
      );
    }
  }

  // Rater-count breakdown (sind mehr Rater = besseres Matching?)
  const byRaterCount: Record<number, number[]> = {};
  for (const user of users) {
    const group = groups.find((g) => g.groupId === user.groupId);
    const rc = group?.raterCount ?? 1;
    const rank = Math.round(1 / (reciprocalRanks[users.indexOf(user)] ?? 1));
    if (!byRaterCount[rc]) byRaterCount[rc] = [];
    byRaterCount[rc].push(rank);
  }
  if (Object.keys(byRaterCount).length > 1) {
    console.log("\n  Rater-Count vs. Avg-Rank (Test: mehr Rater = besseres Matching?):");
    for (const [rc, ranks] of Object.entries(byRaterCount).sort()) {
      const avg = (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1);
      console.log(`  raterCount=${rc}  n=${ranks.length}  AvgRank=${avg}`);
    }
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  db.$disconnect();
  process.exit(1);
});
