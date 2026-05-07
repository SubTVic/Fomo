// SPDX-License-Identifier: AGPL-3.0-only
// Shared types for the live quiz system

export interface QuizThesisData {
  id: string;
  text: string;
  shortTitle: string;
  hint: string | null;
  order: number;
  attributes: { attribute: string; isInverse: boolean }[];
}

export interface QuizGroupData {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  categoryName: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  attributes: Record<string, boolean>;
  nextEventTitle: string | null;
  nextEventDate: string | null;
  nextEventTime: string | null;
  nextEventLocation: string | null;
  nextEventUrl: string | null;
  nextEventIsOpen: boolean;
  selfRating?: {
    raterCount: number;
    filterSelections: string[];
    answers: Array<{ itemId: string; value: number }>;
  } | null;
}

export interface AttributeMatch {
  attribute: string;
  label: string;
  groupHas: boolean;
  userAgrees: boolean;
  similarity: number; // 0.0-1.0
  category: "match" | "partial" | "conflict";
}

export interface QuizMatchResult {
  group: QuizGroupData;
  score: number; // 0-100
  attributeMatches: AttributeMatch[];
}

