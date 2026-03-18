// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useMemo } from "react";
import type { StepProps } from "./types";
import { PERSONAS, resolvePersonaAnswers } from "../personas";
import { computeQuizMatches } from "@/lib/quiz/matching";
import { DemoResults } from "../DemoResults";

export function Step06Compare({ theses, groups }: StepProps) {
  const [maxResults, lenaResults] = useMemo(() => {
    return PERSONAS.map((p) => {
      const answers = resolvePersonaAnswers(p, theses);
      return computeQuizMatches(answers, theses, groups);
    });
  }, [theses, groups]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">Schritt 7</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Selbe Fragen — andere Empfehlungen
        </h2>
        <p className="mt-2 text-sm text-[#5a7a8a]">
          {theses.length} identische Fragen. Zwei verschiedene Antworten. Zwei verschiedene Leben.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-4 border-[#1a2a35] bg-white p-3">
          <DemoResults persona={PERSONAS[0]} results={maxResults} compact />
        </div>
        <div className="border-4 border-[#1a2a35] bg-white p-3">
          <DemoResults persona={PERSONAS[1]} results={lenaResults} compact />
        </div>
      </div>

    </div>
  );
}
