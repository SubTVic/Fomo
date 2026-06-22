// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MatchResult } from "@/lib/types";
import { isUnverified } from "@/lib/data";
import { GroupCard } from "@/components/GroupCard";
import { UnverifiedNotice } from "@/components/UnverifiedNotice";

interface ResultsScreenProps {
  matches: MatchResult[];
  answeredCount: number; // non-neutral answers
  onRestart: () => void;
}

const MAX_RESULTS = 10;

export function ResultsScreen({ matches, answeredCount, onRestart }: ResultsScreenProps) {
  const [showUnverified, setShowUnverified] = useState(false);

  const positives = useMemo(() => matches.filter((m) => m.score > 0), [matches]);
  const unverifiedAvailable = useMemo(
    () => positives.some((m) => isUnverified(m.group)),
    [positives],
  );

  // Only ever show real matches: groups excluded by the filter hard-constraint
  // score 0 and must never appear. Empty list → handled by the message below.
  const top = useMemo(() => {
    const pool = showUnverified
      ? positives
      : positives.filter((m) => !isUnverified(m.group));
    return pool.slice(0, MAX_RESULTS);
  }, [positives, showUnverified]);

  // Competition ranking: equal scores share a rank (#1, #1, #3 …) so groups
  // that fit equally well are shown as equals, not arbitrarily ordered.
  const ranked = top.map((m, i) => {
    const isTie =
      (i > 0 && top[i - 1].score === m.score) ||
      (i < top.length - 1 && top[i + 1].score === m.score);
    return { ...m, rank: i + 1, tied: isTie };
  });
  for (let i = 1; i < ranked.length; i++) {
    if (ranked[i].score === ranked[i - 1].score) ranked[i].rank = ranked[i - 1].rank;
  }

  // Reveal cards one by one for a bit of drama. Reset when the toggle changes.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    setRevealed(0);
  }, [showUnverified]);
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

      {unverifiedAvailable && (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={showUnverified}
            onChange={(e) => setShowUnverified(e.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          <span>Auch unbestätigte Gruppen einbeziehen</span>
        </label>
      )}
      {showUnverified && (
        <div className="mt-3">
          <UnverifiedNotice />
        </div>
      )}

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
              <GroupCard group={m.group} score={m.score} rank={m.rank} tied={m.tied} />
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
