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

  // Exclude standalone items (no dimension) from the survey flow
  const surveyQuestions = questions.filter((q) => q.dimensionId !== null);
  const groupNames = groups.map((g) => g.name);

  return (
    <Suspense>
      <SurveyRouter dimensions={dimensions} questions={surveyQuestions} groupNames={groupNames} />
    </Suspense>
  );
}
