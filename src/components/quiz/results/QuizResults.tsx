// SPDX-License-Identifier: AGPL-3.0-only
// Wahl-O-Mat style results container with overview and comparison tabs
"use client";

import { useState } from "react";
import type { QuizMatchResult, QuizThesisData } from "@/lib/quiz/types";
import { ResultCard } from "./ResultCard";
import { ComparisonTable } from "./ComparisonTable";

interface QuizResultsProps {
  results: QuizMatchResult[];
  theses: QuizThesisData[];
  answeredCount: number;
  onRestart: () => void;
}

export function QuizResults({ results, theses, answeredCount, onRestart }: QuizResultsProps) {
  const [tab, setTab] = useState<"overview" | "compare">("overview");
  const [showAll, setShowAll] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const displayedResults = showAll ? results : results.slice(0, 8);

  function toggleCompare(groupId: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else if (next.size < 8) {
        next.add(groupId);
      }
      return next;
    });
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: "#ADD8E6" }}>
      <div className="mx-auto max-w-[640px] px-4 py-6">
        {/* Header */}
        <div className="border-4 border-[#1a2a35] bg-[#1a2a35] px-6 py-5 text-center">
          <h1
            className="text-xl uppercase tracking-wide text-[#ADD8E6]"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Deine Ergebnisse
          </h1>
          <p className="mt-1 text-sm text-[#ADD8E6]/70">
            {answeredCount} / {theses.length} Thesen beantwortet — {results.length} Gruppen gematcht
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-x-4 border-[#1a2a35] bg-white">
          <button
            onClick={() => setTab("overview")}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              tab === "overview"
                ? "bg-[#1a2a35] text-[#ADD8E6]"
                : "text-[#5a7a8a] hover:bg-[#f0f4f6]"
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setTab("compare")}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-[#1a2a35]/10 ${
              tab === "compare"
                ? "bg-[#1a2a35] text-[#ADD8E6]"
                : "text-[#5a7a8a] hover:bg-[#f0f4f6]"
            }`}
          >
            Vergleich {compareIds.size > 0 && `(${compareIds.size})`}
          </button>
        </div>

        {/* Content */}
        <div className="border-4 border-t-0 border-[#1a2a35] bg-white">
          {tab === "overview" ? (
            <div className="divide-y divide-[#1a2a35]/10">
              {displayedResults.map((result, i) => (
                <ResultCard
                  key={result.group.id}
                  result={result}
                  rank={i + 1}
                  isComparing={compareIds.has(result.group.id)}
                  onToggleCompare={() => toggleCompare(result.group.id)}
                />
              ))}
              {!showAll && results.length > 8 && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-sm text-[#5a8a9a] underline underline-offset-2 hover:text-[#1a2a35]"
                  >
                    Alle {results.length} Gruppen anzeigen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ComparisonTable
              results={results}
              selectedIds={compareIds}
              onToggle={toggleCompare}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <button
            onClick={onRestart}
            className="text-sm text-[#4a7a8a] underline underline-offset-2 hover:text-[#1a2a35] transition-colors"
          >
            Quiz wiederholen
          </button>
        </div>
      </div>
    </div>
  );
}
