// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getGroupsWithProfiles } from "@/lib/queries/groups";
import { computeMatches } from "@/lib/matching";
import { MatchCard } from "@/components/results/MatchCard";
import type { QuizAnswers } from "@/types";

interface ResultsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;

  // Reconstruct answers from URL params (no localStorage)
  const answers: QuizAnswers = {};
  for (const [key, val] of Object.entries(params)) {
    // Multi-choice answers were joined with commas
    answers[key] = val.includes(",") ? val.split(",") : val;
  }

  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Keine Antworten gefunden.</p>
        <Link href="/quiz" className="mt-4 inline-block underline underline-offset-2">
          Quiz starten
        </Link>
      </div>
    );
  }

  const groups = await getGroupsWithProfiles();
  const results = computeMatches(answers, groups).slice(0, 10);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Deine Ergebnisse</h1>
      <p className="mb-8 text-muted-foreground">
        Basierend auf {answeredCount} Antworten – die besten{" "}
        {results.length} Hochschulgruppen für dich.
      </p>

      <div className="flex flex-col gap-4">
        {results.map((result, i) => (
          <MatchCard key={result.group.id} result={result} rank={i + 1} />
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 text-center">
        <Link
          href="/quiz"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Quiz wiederholen
        </Link>
        <Link
          href="/groups"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Alle Gruppen ansehen
        </Link>
      </div>
    </div>
  );
}
