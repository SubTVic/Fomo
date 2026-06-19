// SPDX-License-Identifier: AGPL-3.0-only
// Shared types for the static FOMO site. These mirror the shape of
// `data/groups.json` and `data/quiz.json` — the only data sources for the
// build. Keep them in sync with those files; the code stays generic so a data
// refresh (e.g. swapping in working-set-v3) needs no code change.

/** The 17 binary scraper attributes attached to every group. */
export type GroupAttributes = Record<string, boolean>;

/** One WS2 self-rating answer from a group: itemId → -1 | 0 | 1. */
export interface SelfRatingAnswer {
  itemId: string;
  value: number;
}

export interface GroupSelfRating {
  raterCount: number;
  /** Filter attribute ids the group selected for itself (hard-constraint side). */
  filterSelections: string[];
  answers: SelfRatingAnswer[];
  /**
   * True when the rating was auto-derived from scraped attributes (group has not
   * registered yet), false/absent for a real self-rating. See
   * docs/SCRAPING-KONZEPT.md. Used to flag "unbestätigt" in the UI.
   */
  derived?: boolean;
}

export interface GroupEvent {
  title: string;
  date: string;
  time?: string | null;
  location?: string | null;
  url?: string | null;
  isOpen?: boolean;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  memberCount: number | null;
  language: string | null;
  eventFrequency: string | null;
  groupSize: string | null;
  motto: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  attributes: GroupAttributes;
  nextEvent?: GroupEvent | null;
  selfRating: GroupSelfRating;
}

/** One Likert item shown on its own screen during the quiz. */
export interface QuizItem {
  id: string;
  text: string;
  shortTitle: string;
  construct: string;
  attributes: Array<{
    attribute: string;
    isInverse?: boolean;
    valueMap?: Record<string, number>;
  }>;
}

/** One option on the multi-select filter screen. */
export interface QuizFilterOption {
  id: string;
  label: string;
  attribute: string;
  groupCount: number;
}

export interface QuizFilters {
  type: string;
  question: string;
  subtitle: string;
  options: QuizFilterOption[];
}

export interface QuizData {
  items: QuizItem[];
  filters: QuizFilters;
}

/** Result of matching a user against one group. */
export interface MatchResult {
  group: Group;
  score: number;
}
