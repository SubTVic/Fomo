// SPDX-License-Identifier: AGPL-3.0-only
// Client-side v2 matching. Runs entirely in the browser — no user data is sent
// to any server (DSGVO by design, see CLAUDE.md).
//
// Ported and simplified from `computeV2Match` in the dynamic app
// (src/lib/quiz/matching.ts). Because here the quiz items ARE the questions,
// there is no thesis→item indirection: user answers are already keyed by itemId
// with values -1 | 0 | 1.

import type { Group, MatchResult, SelfRatingAnswer } from "./types";

/** User answers keyed by quiz item id. -1 = disagree, 0 = neutral, 1 = agree. */
export type UserAnswers = Record<string, number>;

/**
 * Mean-absolute-distance score between one user and one group.
 *
 *  - Filter hard constraint: if the user AND the group each picked filters and
 *    they do not overlap → score 0 (the group is excluded).
 *  - Otherwise, over the user's non-neutral answers:
 *      totalDist = Σ |userValue - groupValue|   (groupValue defaults to 0 when
 *                                                 the group never rated the item)
 *      score     = round((1 - totalDist / (n * 2)) * 100)
 *  - With zero active answers → 50 (no signal).
 */
export function scoreGroup(
  userAnswers: UserAnswers,
  userFilters: string[],
  group: Group,
): number {
  return scoreGroupDetailed(userAnswers, userFilters, group).score;
}

interface DetailedScore {
  /** Rounded 0–100 score for display and events. */
  score: number;
  /** Unrounded fit ratio — the sort key (avoids rounding-made ties). */
  raw: number;
  /** True when the group EXPLICITLY shares a selected filter (not merely
   *  passing because it never provided filter data). */
  explicitFilterMatch: boolean;
}

function scoreGroupDetailed(
  userAnswers: UserAnswers,
  userFilters: string[],
  group: Group,
): DetailedScore {
  const groupFilters = group.selfRating.filterSelections ?? [];
  const explicitFilterMatch =
    userFilters.length > 0 &&
    groupFilters.length > 0 &&
    userFilters.some((f) => groupFilters.includes(f));
  if (userFilters.length > 0 && groupFilters.length > 0 && !explicitFilterMatch) {
    return { score: 0, raw: 0, explicitFilterMatch: false };
  }

  const groupMap = answersToMap(group.selfRating.answers);

  const active = Object.entries(userAnswers).filter(([, v]) => v !== 0);
  if (active.length === 0) return { score: 50, raw: 0.5, explicitFilterMatch };

  const totalDist = active.reduce((sum, [itemId, u]) => {
    const g = groupMap[itemId] ?? 0;
    return sum + Math.abs(u - g); // per-item max distance = 2
  }, 0);

  const raw = 1 - totalDist / (active.length * 2);
  return { score: Math.round(raw * 100), raw, explicitFilterMatch };
}

/**
 * Score every group and return them sorted best-first.
 *
 * Sort design (fairness — see the bias section of the /report/):
 *  1. Unrounded fit first: two groups only tie when their distance to the
 *     user is IDENTICAL, not merely rounded to the same percent.
 *  2. At a genuine tie, groups that explicitly share a selected filter beat
 *     groups that only pass because they never provided filter data (those
 *     survive every filter and would otherwise be structurally over-shown).
 *  3. Remaining ties break by a hash of (group, user answers): deterministic
 *     for the same answers — a shared ?r= link always renders the same order —
 *     but different across users, so tie exposure is spread over the
 *     population instead of always favoring the same groups (the previous
 *     raterCount/alphabet tie-breaker gave a fixed set of groups a permanent
 *     top-3 seat).
 */
export function computeMatches(
  userAnswers: UserAnswers,
  userFilters: string[],
  groups: Group[],
): MatchResult[] {
  const userKey =
    Object.entries(userAnswers)
      .map(([id, v]) => id + v)
      .sort()
      .join("") +
    "|" +
    [...userFilters].sort().join(",");
  return groups
    .map((group) => ({
      group,
      detail: scoreGroupDetailed(userAnswers, userFilters, group),
      tieHash: fnv1a(`${group.slug}|${userKey}`),
    }))
    .sort(
      (a, b) =>
        b.detail.raw - a.detail.raw ||
        Number(b.detail.explicitFilterMatch) - Number(a.detail.explicitFilterMatch) ||
        a.tieHash - b.tieHash ||
        a.group.name.localeCompare(b.group.name, "de"),
    )
    .map(({ group, detail }) => ({ group, score: detail.score }));
}

/** FNV-1a string hash — tiny, deterministic, good spread for tie-breaking. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The initially visible results: the first `n` positive-score matches PLUS all
 * groups tied with the score at the boundary (capped at `cap`).
 *
 * Why: simulation showed a score tie exactly at the top-5 boundary in ~65% of
 * quizzes. A hard cut would hand the last visible slot to the same groups
 * every time (raterCount, then alphabet — deterministic, never random), which
 * is a systematic bias invisible to users. Including boundary ties keeps the
 * cut fair AND deterministic (shared ?r= links stay stable).
 */
export function topWithTies(matches: MatchResult[], n = 5, cap = 10): MatchResult[] {
  const positive = matches.filter((m) => m.score > 0);
  if (positive.length <= n) return positive;
  let end = n;
  while (end < positive.length && end < cap && positive[end].score === positive[n - 1].score) end++;
  return positive.slice(0, end);
}

function answersToMap(answers: SelfRatingAnswer[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const a of answers) map[a.itemId] = a.value;
  return map;
}
