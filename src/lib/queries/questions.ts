// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";
import type { QuestionWithOptions } from "@/types";

// All questions ordered for the quiz
export async function getQuestionsForQuiz(): Promise<QuestionWithOptions[]> {
  return db.question.findMany({
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
}

// All questions for admin management
export async function getAllQuestionsForAdmin(): Promise<QuestionWithOptions[]> {
  return db.question.findMany({
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
}
