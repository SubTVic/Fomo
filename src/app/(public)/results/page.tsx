// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getGroupsWithProfiles } from "@/lib/queries/groups";

export const dynamic = "force-dynamic";
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
    answers[key] = val.includes(",") ? val.split(",") : val;
  }

  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-20 text-center">
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
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[600px] border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
          <h1 className="font-heading text-xl uppercase">Deine Ergebnisse</h1>
          <p className="text-sm text-primary-foreground/60 mt-1">
            Basierend auf {answeredCount} Antworten — die besten{" "}
            {results.length} Hochschulgruppen für dich.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 flex flex-col gap-4">
          {results.map((result, i) => (
            <MatchCard key={result.group.id} result={result} rank={i + 1} />
          ))}
        </div>

        <div className="border-t-4 border-foreground px-6 py-6 sm:px-8 flex flex-col gap-3 text-center">
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
    </div>
  );
}
