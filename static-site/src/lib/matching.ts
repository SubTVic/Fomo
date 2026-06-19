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
  const groupFilters = group.selfRating.filterSelections ?? [];
  if (userFilters.length > 0 && groupFilters.length > 0) {
    const overlap = userFilters.some((f) => groupFilters.includes(f));
    if (!overlap) return 0;
  }

  const groupMap = answersToMap(group.selfRating.answers);

  const active = Object.entries(userAnswers).filter(([, v]) => v !== 0);
  if (active.length === 0) return 50;

  const totalDist = active.reduce((sum, [itemId, u]) => {
    const g = groupMap[itemId] ?? 0;
    return sum + Math.abs(u - g); // per-item max distance = 2
  }, 0);

  const maxDist = active.length * 2;
  return Math.round((1 - totalDist / maxDist) * 100);
}

/** Score every group and return them sorted best-first. */
export function computeMatches(
  userAnswers: UserAnswers,
  userFilters: string[],
  groups: Group[],
): MatchResult[] {
  return groups
    .map((group) => ({ group, score: scoreGroup(userAnswers, userFilters, group) }))
    .sort(
      (a, b) =>
        // Primary: best score first. Tie-breakers are only for a *stable,
        // reproducible* order — equally-scored groups genuinely fit equally
        // well (the UI marks them "punktgleich"). Prefer the more confident
        // self-rating (higher raterCount), then alphabetical for determinism.
        b.score - a.score ||
        (b.group.selfRating.raterCount ?? 0) - (a.group.selfRating.raterCount ?? 0) ||
        a.group.name.localeCompare(b.group.name, "de"),
    );
}

function answersToMap(answers: SelfRatingAnswer[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const a of answers) map[a.itemId] = a.value;
  return map;
}
