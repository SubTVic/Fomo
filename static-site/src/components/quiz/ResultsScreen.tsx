// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MatchResult } from "@/lib/types";
import { GroupCard } from "@/components/GroupCard";

interface ResultsScreenProps {
  matches: MatchResult[];
  answeredCount: number; // non-neutral answers
  onRestart: () => void;
}

const MAX_RESULTS = 10;

export function ResultsScreen({ matches, answeredCount, onRestart }: ResultsScreenProps) {
  // Only ever show real matches: groups excluded by the filter hard-constraint
  // score 0 and must never appear. Empty list → handled by the message below.
  const top = matches.filter((m) => m.score > 0).slice(0, MAX_RESULTS);

  // Reveal cards one by one for a bit of drama.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (revealed >= top.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 180);
    return () => clearTimeout(t);
  }, [revealed, top.length]);

  return (
    <div className="animate-fade-up">
      <p className="font-heading text-sm text-accent-muted">DEINE MATCHES</p>
      <h1 className="mt-1 text-3xl text-navy sm:text-4xl">Das passt zu dir</h1>
      <p className="mt-2 text-sm text-body">
        Basierend auf {answeredCount} klaren Antworten. Tipp: Schreib einfach mal eine
        Gruppe an — die meisten freuen sich über Neugierige.
      </p>

      {top.length === 0 ? (
        <div className="mt-6 border-poster bg-card p-6 text-center">
          <p className="text-body">
            Keine eindeutigen Treffer. Probier es mit weniger Filtern oder klareren Antworten.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {top.map((m, i) => (
            <div
              key={m.group.id}
              className={i < revealed ? "animate-fade-up" : "invisible"}
            >
              <GroupCard group={m.group} score={m.score} rank={i + 1} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          Alle Gruppen ansehen
        </Link>
      </div>
    </div>
  );
}
