// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getGroups, getQuizItems, getQuizFilters } from "@/lib/data";
import { translateQuizFilters, translateQuizItems } from "@/lib/quiz-translations";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Answer a few questions and find student groups that fit you.",
  alternates: seoAlternates("/quiz", "/en/quiz", "en"),
};

export default function EnglishQuizPage() {
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6 sm:px-6">
      <QuizFlow
        items={translateQuizItems(getQuizItems())}
        filters={translateQuizFilters(getQuizFilters())}
        groups={getGroups()}
        lang="en"
      />
    </div>
  );
}
