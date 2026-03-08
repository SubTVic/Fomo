// SPDX-License-Identifier: AGPL-3.0-only

import { Suspense } from "react";
import { GroupRegisterForm } from "./GroupRegisterForm";
import { getGroupSurveyData } from "@/lib/group-survey-questions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gruppe registrieren – FOMO",
};

export default async function GroupRegisterPage() {
  const { dimensions, questions } = await getGroupSurveyData();

  return (
    <Suspense>
      <GroupRegisterForm dimensions={dimensions} questions={questions as (typeof questions[number] & { dimensionId: string })[]} />
    </Suspense>
  );
}
