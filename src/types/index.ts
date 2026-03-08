// SPDX-License-Identifier: AGPL-3.0-only

import type { Category, Group, GroupProfile, Question, QuestionOption } from "@prisma/client";

// ---------------------------------------------------------------------------
// Quiz types
// ---------------------------------------------------------------------------

// Quiz answer map: questionId → answer value
export type QuizAnswers = Record<string, string | string[]>;

// Quiz state managed by useReducer (see src/lib/quiz-reducer.ts)
export interface QuizState {
  currentIndex: number;
  answers: QuizAnswers;
  isComplete: boolean;
}

export type QuizAction =
  | { type: "ANSWER"; questionId: string; value: string | string[] }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "COMPLETE" };

// ---------------------------------------------------------------------------
// Data types (derived from Prisma models)
// ---------------------------------------------------------------------------

// Question with its answer options (used in quiz and admin)
export type QuestionWithOptions = Question & {
  options: QuestionOption[];
};

// Group with all data needed for matching and display
export type GroupWithProfile = Group & {
  category: Category;
  profiles: (GroupProfile & {
    question: QuestionWithOptions;
  })[];
};

// Group with category only (used in group overview, no profile needed)
export type GroupWithCategory = Group & {
  category: Category;
};

// Single match result
export interface MatchResult {
  group: GroupWithProfile;
  score: number; // 0–100
}
