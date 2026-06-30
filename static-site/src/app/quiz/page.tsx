// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getGroups, getQuizItems, getQuizFilters } from "@/lib/data";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Beantworte ein paar Fragen und finde deine passenden Hochschulgruppen.",
  alternates: seoAlternates("/quiz", "/en/quiz", "de"),
};

export default function QuizPage() {
  // All data is embedded at build time and handed to the client component.
  // Matching then runs entirely in the browser — nothing is sent to a server.
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6 sm:px-6">
      <QuizFlow
        items={getQuizItems()}
        filters={getQuizFilters()}
        groups={getGroups()}
        lang="de"
      />
    </div>
  );
}
