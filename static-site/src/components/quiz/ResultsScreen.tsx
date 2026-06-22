// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MatchResult } from "@/lib/types";
import { GroupCard } from "@/components/GroupCard";
import { ShareButton } from "./ShareButton";

interface ResultsScreenProps {
  matches: MatchResult[];
  answeredCount: number; // non-neutral answers
  resultsParam: string; // encoded answers, for sharing + detail back-links
  onRestart: () => void;
}

const MAX_RESULTS = 10;

export function ResultsScreen({ matches, answeredCount, resultsParam, onRestart }: ResultsScreenProps) {
  // Only ever show real matches: groups excluded by the filter hard-constraint
  // score 0 and must never appear. Empty list → handled by the message below.
  const top = matches.filter((m) => m.score > 0).slice(0, MAX_RESULTS);

  // Competition ranking: equal scores share a rank (#1, #1, #3 …) so groups
  // that fit equally well are shown as equals, not arbitrarily ordered.
  const ranked = top.map((m, i) => {
    const isTie =
      (i > 0 && top[i - 1].score === m.score) ||
      (i < top.length - 1 && top[i + 1].score === m.score);
    return { ...m, rank: i + 1, tied: isTie };
  });
  for (let i = 1; i < ranked.length; i++) {
    // Tied row inherits the first rank of its score group.
    if (ranked[i].score === ranked[i - 1].score) ranked[i].rank = ranked[i - 1].rank;
  }

  // Reveal cards one by one for a bit of drama.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (revealed >= ranked.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 180);
    return () => clearTimeout(t);
  }, [revealed, ranked.length]);

  return (
    <div className="animate-fade-up">
      <p className="font-heading text-sm text-accent-muted">DEINE MATCHES</p>
      <h1 className="mt-1 text-3xl text-navy sm:text-4xl">Das passt zu dir</h1>
      <p className="mt-2 text-sm text-body">
        Basierend auf {answeredCount} klaren Antworten. Gruppen mit gleicher Prozentzahl
        passen gleich gut — die Reihenfolge dazwischen sagt nichts aus.
      </p>
      <p className="mt-1 text-xs text-muted">
        Tipp: Speichere oder teile den Link — er bringt dich genau zu diesem Ergebnis zurück.
      </p>

      {ranked.length === 0 ? (
        <div className="mt-6 border-poster bg-card p-6 text-center">
          <p className="text-body">
            Keine eindeutigen Treffer. Probier es mit weniger Filtern oder klareren Antworten.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {ranked.map((m, i) => (
            <div
              key={m.group.id}
              className={i < revealed ? "animate-fade-up" : "invisible"}
            >
              <GroupCard
                group={m.group}
                score={m.score}
                rank={m.rank}
                tied={m.tied}
                resultsParam={resultsParam}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <ShareButton />
        <button
          type="button"
          onClick={onRestart}
          className="border-poster bg-card px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-surface"
        >
          Nochmal
        </button>
        <Link
          href="/groups"
          className="border-poster bg-navy px-6 py-3 text-center font-heading text-sky transition-colors hover:bg-navy-hover"
        >
          Alle Gruppen
        </Link>
      </div>
    </div>
  );
}
