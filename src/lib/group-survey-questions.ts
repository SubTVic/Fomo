// SPDX-License-Identifier: AGPL-3.0-only
// Questions shown to Hochschulgruppen during registration.
// After pilot analysis, INCLUDED_QUESTION_IDS will be reduced to ~40 best questions.

import { PILOT_QUESTIONS, DIMENSIONS } from "./pilot-questions";
import type { PilotQuestion, Dimension } from "./pilot-questions";

export type { PilotQuestion, Dimension };

// All 60 questions for now; narrow this list after pilot evaluation
const INCLUDED_QUESTION_IDS: string[] = PILOT_QUESTIONS.map((q) => q.id);

export function getGroupSurveyQuestions(): PilotQuestion[] {
  return PILOT_QUESTIONS.filter((q) => INCLUDED_QUESTION_IDS.includes(q.id));
}

export function getGroupSurveyDimensions(): Dimension[] {
  const questionSet = new Set(INCLUDED_QUESTION_IDS);
  const usedDimIds = new Set(
    PILOT_QUESTIONS.filter((q) => questionSet.has(q.id)).map((q) => q.dimensionId)
  );
  return DIMENSIONS.filter((d) => usedDimIds.has(d.id));
}
