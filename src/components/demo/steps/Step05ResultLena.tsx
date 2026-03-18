// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useMemo } from "react";
import type { StepProps } from "./types";
import { PERSONAS, resolvePersonaAnswers } from "../personas";
import { computeQuizMatches } from "@/lib/quiz/matching";
import { DemoResults } from "../DemoResults";

export function Step05ResultLena({ theses, groups }: StepProps) {
  const persona = PERSONAS[1];
  const results = useMemo(() => {
    const answers = resolvePersonaAnswers(persona, theses);
    return computeQuizMatches(answers, theses, groups);
  }, [persona, theses, groups]);

  const top3 = results.slice(0, 3);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">Schritt 6</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Ergebnis für {persona.emoji} {persona.name}
        </h2>
      </div>

      {/* Top 3 highlight */}
      <div className="grid grid-cols-3 gap-2">
        {top3.map((r, i) => (
          <div
            key={r.group.id}
            className="border-4 bg-white p-3 text-center"
            style={{ borderColor: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : "#b45309" }}
          >
            <div className="text-2xl">{["🥇", "🥈", "🥉"][i]}</div>
            <p className="mt-1 text-xs font-bold text-[#1a2a35] leading-tight">{r.group.name}</p>
            <p className="mt-1 text-sm font-black" style={{ color: i === 0 ? "#d97706" : "#6b7280" }}>
              {r.score}%
            </p>
          </div>
        ))}
      </div>

      <div className="border-4 border-[#1a2a35] bg-white p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1a2a35]">
          Alle {results.length} Gruppen — sortiert nach Übereinstimmung
        </p>
        <DemoResults persona={persona} results={results} />
      </div>

      <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-4 text-sm text-white">
        <strong className="text-[#ADD8E6]">Warum andere Gruppen?</strong>{" "}
        {persona.name} hat soziales Engagement, Kreativität und Gemeinschaft stark bewertet — FOMO findet Gruppen mit den Attributen <em>socialImpact</em>, <em>arts</em> und <em>beginnerFriendly</em>.
      </div>
    </div>
  );
}
