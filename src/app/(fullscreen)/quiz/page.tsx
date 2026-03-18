// SPDX-License-Identifier: AGPL-3.0-only

import { getActiveQuizTheses, getQuizGroups, getQuizVariant } from "@/lib/queries/quiz";
import { QuizRouter } from "@/components/quiz/QuizRouter";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const [theses, groups, variant] = await Promise.all([
    getActiveQuizTheses(),
    getQuizGroups(),
    getQuizVariant(),
  ]);

  return <QuizRouter theses={theses} groups={groups} variant={variant} />;
}
