// SPDX-License-Identifier: AGPL-3.0-only
// Type definitions for pilot survey dimensions and questions.
// Actual data is stored in the database and managed via the admin dashboard.

export interface Dimension {
  id: string; // "D1"
  label: string; // "Zeitbudget & Verbindlichkeit"
  emoji: string; // "⏰"
  description: string; // Short explanation shown to users
  blockIndex: number; // 0-3: which variant block
}

export interface PilotQuestion {
  id: string; // "D1Q1" or "S1" for standalone
  dimensionId: string | null; // "D1" or null for standalone items
  text: string; // Statement in first person (Ich-Form)
  isInverse?: boolean; // true if item is reverse-coded
}

// Helper: get dimension object by id from an array
export function getDimension(dimensions: Dimension[], id: string): Dimension {
  return dimensions.find((d) => d.id === id) ?? dimensions[0];
}

// Helper: get all questions for a dimension from an array
export function getQuestionsForDimension(
  questions: PilotQuestion[],
  dimensionId: string,
): PilotQuestion[] {
  return questions.filter((q) => q.dimensionId === dimensionId);
}

// Helper: get global question index
export function getQuestionIndex(
  questions: PilotQuestion[],
  questionId: string,
): number {
  return questions.findIndex((q) => q.id === questionId);
}
