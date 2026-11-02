// SPDX-License-Identifier: AGPL-3.0-only
// Encode a finished quiz into a compact, URL-safe string so results can be
// saved (bookmark/share the URL) and restored — without localStorage.
// Format: "<answers>-<filters>" where answers is one digit per quiz item
// (0=disagree, 1=neutral, 2=agree, in quiz.json order) and filters is one bit
// per filter option (1=selected, in quiz.json order).
// Links from before the 11/2026 switch to 5 areas carry one bit per OLD filter
// (8 digits, filters.legacyOptions order); they are translated to areas.

import type { UserAnswers } from "./matching";
import type { QuizItem, QuizFilters } from "./types";
import { toAreas } from "./areas";

export function encodeResults(
  answers: UserAnswers,
  filters: string[],
  items: QuizItem[],
  quizFilters: QuizFilters,
): string {
  const a = items.map((it) => String((answers[it.id] ?? 0) + 1)).join("");
  const f = quizFilters.options.map((o) => (filters.includes(o.attribute) ? "1" : "0")).join("");
  return `${a}-${f}`;
}

export function decodeResults(
  r: string,
  items: QuizItem[],
  quizFilters: QuizFilters,
): { answers: UserAnswers; filters: string[] } | null {
  const [a, f = ""] = r.split("-");
  if (!a || a.length !== items.length || !/^[012]+$/.test(a)) return null;

  const answers: UserAnswers = {};
  items.forEach((it, i) => {
    answers[it.id] = Number(a[i]) - 1; // 0|1|2 → -1|0|1
  });
  const legacy = quizFilters.legacyOptions ?? [];
  const isLegacy = legacy.length > 0 && f.length === legacy.length && f.length !== quizFilters.options.length;
  const filters = isLegacy
    ? toAreas(legacy.filter((o, i) => f[i] === "1").map((o) => o.attribute), quizFilters)
    : quizFilters.options.filter((o, i) => f[i] === "1").map((o) => o.attribute);

  return { answers, filters };
}

/** Read the `r` results param from the current URL (client only). */
export function readResultsParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("r");
}
