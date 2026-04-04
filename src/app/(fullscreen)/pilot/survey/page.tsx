// SPDX-License-Identifier: AGPL-3.0-only
// Pilot survey page — fetches dimensions/questions from DB and renders the SurveyRouter

import { Suspense } from "react";
import { SurveyRouter } from "@/components/survey/SurveyRouter";
import { getSerializedPilotData } from "@/lib/queries/pilot";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FOMO Pilot – Umfrage",
  description: "Hilf uns, FOMO besser zu machen. Beantworte unsere kurzen Fragen.",
};

export default async function PilotSurveyPage() {
  const [{ dimensions, questions }, groups] = await Promise.all([
    getSerializedPilotData(),
    db.group.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const standaloneQuestions = questions.filter((q) => q.dimensionId === null);
  const dimensionQuestions = questions.filter((q) => q.dimensionId !== null);
  const groupNames = groups.map((g) => g.name);

  // Treat standalone questions as their own dimension so they get included in a block
  const allDimensions = standaloneQuestions.length > 0
    ? [...dimensions, { id: "__standalone__", label: "Sonstiges", emoji: "📌", description: "Weitere Fragen", blockIndex: dimensions.at(-1)?.blockIndex ?? 3 }]
    : dimensions;
  const allQuestions = standaloneQuestions.length > 0
    ? [...dimensionQuestions, ...standaloneQuestions.map((q) => ({ ...q, dimensionId: "__standalone__" }))]
    : dimensionQuestions;

  return (
    <Suspense>
      <SurveyRouter
        dimensions={allDimensions}
        questions={allQuestions}
        groupNames={groupNames}
      />
    </Suspense>
  );
}
