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

/**
 * Fallback for groups whose category has no colour in the data (e.g.
 * "Sonstiges"). Without it the white category badge would render with no
 * background — invisible on the white card.
 */
export const CATEGORY_FALLBACK_COLOR = "#5a8a9a";

/** The badge colour for a group, never empty. */
export function categoryColorOf(group: Group): string {
  return group.categoryColor || CATEGORY_FALLBACK_COLOR;
}

/** Distinct categories with their poster colour, sorted by name. */
export function getCategories(): Array<{ name: string; color: string }> {
  const seen = new Map<string, string>();
  for (const g of groups) {
    // Prefer the first non-empty colour seen for a category, else fall back.
    const existing = seen.get(g.categoryName);
    if (!existing || existing === CATEGORY_FALLBACK_COLOR) {
      seen.set(g.categoryName, g.categoryColor || CATEGORY_FALLBACK_COLOR);
    }
  }
  return [...seen.entries()]
    .map(([name, color]) => ({ name, color }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}
