// SPDX-License-Identifier: AGPL-3.0-only

// ---------------------------------------------------------------------------
// Live Quiz types — all matching runs client-side, no server requests
// ---------------------------------------------------------------------------

/** Binary group attributes used for matching */
export type GroupAttribute =
  | "career"
  | "tech"
  | "language"
  | "social_impact"
  | "party"
  | "religion"
  | "sports"
  | "networking"
  | "arts"
  | "music"
  | "time_low"
  | "hands_on"
  | "outdoor"
  | "international"
  | "beginner_friendly"
  | "competitive"
  | "event_frequency"
  | "leadership_opportunities"
  | "group_size";

/** A group with its binary attribute profile */
export interface LiveGroup {
  id: string;
  name: string;
  description: string;
  website?: string;
  nextEvent?: string;
  attributes: Record<GroupAttribute, 0 | 1>;
}

/** Attribute mapping for a question — optionally inverse */
export interface AttributeMapping {
  attribute: GroupAttribute;
  inverse?: boolean;
}

/** A quiz question (thesis) */
export interface LiveQuestion {
  id: number;
  shortTitle: string;
  thesis: string;
  mappings: AttributeMapping[];
}

/** User answer: agree / neutral / disagree / skipped */
export type AnswerValue = "agree" | "neutral" | "disagree" | null;

/** User answer state for a single question */
export interface UserAnswer {
  value: AnswerValue;
  doubleWeight: boolean;
}

/** Per-attribute match detail for display */
export interface AttributeMatch {
  attribute: GroupAttribute;
  label: string;
  similarity: number; // 0–1
  category: "match" | "partial" | "conflict";
}

/** Result for a single group */
export interface LiveMatchResult {
  group: LiveGroup;
  score: number; // 0–100
  attributeMatches: AttributeMatch[];
}

/** Full quiz state */
export interface LiveQuizState {
  phase: "welcome" | "quiz" | "results";
  currentIndex: number;
  answers: (UserAnswer | null)[];
}
