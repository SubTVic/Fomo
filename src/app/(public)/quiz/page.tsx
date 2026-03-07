// SPDX-License-Identifier: AGPL-3.0-only

import { getQuestionsForQuiz } from "@/lib/queries/questions";
import { QuizContainer } from "@/components/quiz/QuizContainer";

export default async function QuizPage() {
  const questions = await getQuestionsForQuiz();

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[600px] border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
          <h1 className="font-heading text-xl uppercase">Dein Quiz</h1>
        </div>
        <div className="px-6 py-8 sm:px-8">
          <QuizContainer questions={questions} />
        </div>
      </div>
    </div>
  );
}
