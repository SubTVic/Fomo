// SPDX-License-Identifier: AGPL-3.0-only
// Build-time data layer. The JSON files are imported statically so Next.js
// inlines them into the bundle during `output: 'export'` — there is no runtime
// fetch and no server. Swapping the JSON + rebuilding is the only step needed
// to update the live data (see acceptance criterion 4).

import groupsJson from "../../data/groups.json";
import quizJson from "../../data/quiz.json";
import type { Group, QuizData, QuizItem, QuizFilters } from "./types";

const groups = (groupsJson as { groups: Group[] }).groups;
const quiz = quizJson as unknown as QuizData;

/** All verified groups (the JSON already excludes unverified ones). */
export function getGroups(): Group[] {
  return groups;
}

export function getGroupBySlug(slug: string): Group | undefined {
  return groups.find((g) => g.slug === slug);
}

export function getQuizItems(): QuizItem[] {
  return quiz.items;
}

export function getQuizFilters(): QuizFilters {
  return quiz.filters;
}

/** Distinct categories with their poster colour, sorted by name. */
export function getCategories(): Array<{ name: string; color: string }> {
  const seen = new Map<string, string>();
  for (const g of groups) {
    if (!seen.has(g.categoryName)) seen.set(g.categoryName, g.categoryColor);
  }
  return [...seen.entries()]
    .map(([name, color]) => ({ name, color }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}
