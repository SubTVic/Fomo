// SPDX-License-Identifier: AGPL-3.0-only
// Questions shown to Hochschulgruppen during registration.
// Fetches from DB. After pilot analysis, filter via INCLUDED_QUESTION_IDS.

import { getSerializedPilotData } from "@/lib/queries/pilot";
import type { SerializedDimension, SerializedQuestion } from "@/lib/queries/pilot";

export type { SerializedDimension as Dimension, SerializedQuestion as PilotQuestion };

export async function getGroupSurveyQuestions(): Promise<SerializedQuestion[]> {
  const { questions } = await getSerializedPilotData();
  return questions.filter((q) => q.dimensionId !== null);
}

export async function getGroupSurveyDimensions(): Promise<SerializedDimension[]> {
  const { dimensions } = await getSerializedPilotData();
  return dimensions;
}

export async function getGroupSurveyData() {
  const { dimensions, questions } = await getSerializedPilotData();
  return { dimensions, questions: questions.filter((q) => q.dimensionId !== null) };
}
