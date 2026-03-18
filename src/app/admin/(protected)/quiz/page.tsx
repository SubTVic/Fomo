// SPDX-License-Identifier: AGPL-3.0-only

import { getAllQuizThesesForAdmin } from "@/lib/queries/quiz";
import { getQuizVariant } from "@/lib/queries/quiz";
import { QuizThesisManager } from "./QuizThesisManager";

export const dynamic = "force-dynamic";

export default async function AdminQuizPage() {
  const [theses, variant] = await Promise.all([
    getAllQuizThesesForAdmin(),
    getQuizVariant(),
  ]);

  // Serialize dates for client component
  const serialized = theses.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-heading text-2xl uppercase">Quiz-Thesen</h1>
      <QuizThesisManager initialTheses={serialized} initialVariant={variant} />
    </div>
  );
}
