// SPDX-License-Identifier: AGPL-3.0-only

import { getAllQuestionsForAdmin } from "@/lib/queries/questions";
import QuestionList from "./QuestionList";

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestionsForAdmin();

  return (
    <div className="mx-auto max-w-5xl">
      <QuestionList questions={questions} />
    </div>
  );
}
