// SPDX-License-Identifier: AGPL-3.0-only
// Build-time data layer. The JSON files are imported statically so Next.js
// inlines them into the bundle during `output: 'export'` — there is no runtime
// fetch and no server. Swapping the JSON + rebuilding is the only step needed
// to update the live data (see acceptance criterion 4).

import groupsJson from "../../data/groups.json";
import quizJson from "../../data/quiz.json";
import logosJson from "../../data/logos.json";
import type { Group, QuizData, QuizItem, QuizFilters } from "./types";

// Logo overlay (slug → /logos/file). Kept separate from groups.json so logos
// can be added without touching the big data file; a group's own logoUrl wins.
const logos = logosJson as Record<string, string>;
const groups = (groupsJson as { groups: Group[] }).groups.map((g) => ({
  ...g,
  logoUrl: g.logoUrl ?? logos[g.slug] ?? null,
}));
const quiz = quizJson as unknown as QuizData;

/** All verified groups (the JSON already excludes unverified ones). */
export function getGroups(): Group[] {
  return groups;
}

/** A group whose profile was auto-derived (scraped), not confirmed by the group. */
export function isUnverified(group: Group): boolean {
  return group.selfRating.derived === true;
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
 * Fallback for categories that have no colour anywhere in the data (e.g.
 * "Sonstiges"). Without it the white category badge would render with no
 * background — invisible on the white card.
 */
export const CATEGORY_FALLBACK_COLOR = "#5a8a9a";

// Resolve one colour per category (first non-empty seen). Scraped groups often
// have a null categoryColor even though other groups in the same category carry
// one — so the badge colour is taken at the category level, not per group.
const categoryColors = new Map<string, string>();
for (const g of groups) {
  if (g.categoryColor && !categoryColors.has(g.categoryName)) {
    categoryColors.set(g.categoryName, g.categoryColor);
  }
}

/** The badge colour for a group, never empty (resolved per category). */
export function categoryColorOf(group: Group): string {
  return categoryColors.get(group.categoryName) || group.categoryColor || CATEGORY_FALLBACK_COLOR;
}

/** Distinct categories with their poster colour, sorted by name. */
export function getCategories(): Array<{ name: string; color: string }> {
  const names = new Set(groups.map((g) => g.categoryName));
  return [...names]
    .map((name) => ({ name, color: categoryColors.get(name) || CATEGORY_FALLBACK_COLOR }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}
