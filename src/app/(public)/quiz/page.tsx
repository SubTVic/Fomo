// SPDX-License-Identifier: AGPL-3.0-only

import { getQuestionsForQuiz } from "@/lib/queries/questions";
import { QuizContainer } from "@/components/quiz/QuizContainer";

export default async function QuizPage() {
  const questions = await getQuestionsForQuiz();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">Dein Quiz</h1>
      <QuizContainer questions={questions} />
    </div>
  );
}
