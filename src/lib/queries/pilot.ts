// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";

/** Fetch all pilot dimensions with their questions, ordered. */
export async function getPilotDimensionsWithQuestions() {
  return db.pilotDimension.findMany({
    include: { questions: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
}

/** Fetch all pilot dimensions (without questions). */
export async function getPilotDimensions() {
  return db.pilotDimension.findMany({ orderBy: { order: "asc" } });
}

/** Fetch all pilot survey questions, ordered by dimension then question order. */
export async function getPilotSurveyQuestions() {
  return db.pilotSurveyQuestion.findMany({
    include: { dimension: true },
    orderBy: [{ dimension: { order: "asc" } }, { order: "asc" }],
  });
}

/** Serialized types for passing to client components (no Date objects). */
export interface SerializedDimension {
  id: string;
  label: string;
  emoji: string;
  description: string;
  blockIndex: number;
  order: number;
}

export interface SerializedQuestion {
  id: string;
  dimensionId: string | null;
  text: string;
  order: number;
  isInverse: boolean;
}

/** Fetch standalone questions (no dimension). */
export async function getStandaloneQuestions() {
  return db.pilotSurveyQuestion.findMany({
    where: { dimensionId: null },
    orderBy: { order: "asc" },
  });
}

/** Serialize dimensions + questions for client components. */
export async function getSerializedPilotData() {
  const dims = await getPilotDimensionsWithQuestions();
  const standalone = await getStandaloneQuestions();

  const dimensions: SerializedDimension[] = dims.map((d) => ({
    id: d.id,
    label: d.label,
    emoji: d.emoji,
    description: d.description,
    blockIndex: d.blockIndex,
    order: d.order,
  }));

  const dimQuestions: SerializedQuestion[] = dims.flatMap((d) =>
    d.questions.map((q) => ({
      id: q.id,
      dimensionId: q.dimensionId,
      text: q.text,
      order: q.order,
      isInverse: q.isInverse,
    })),
  );

  const standaloneQuestions: SerializedQuestion[] = standalone.map((q) => ({
    id: q.id,
    dimensionId: null,
    text: q.text,
    order: q.order,
    isInverse: q.isInverse,
  }));

  return { dimensions, questions: [...dimQuestions, ...standaloneQuestions] };
}
