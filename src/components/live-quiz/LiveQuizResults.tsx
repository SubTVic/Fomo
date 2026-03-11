// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState, useCallback } from "react";
import type { LiveMatchResult } from "@/lib/live-quiz/types";
import { LiveResultCard } from "./LiveResultCard";
import { LiveCompareTab } from "./LiveCompareTab";

interface LiveQuizResultsProps {
  results: LiveMatchResult[];
  strongAnswers: number;
  neutralAnswers: number;
  onRestart: () => void;
}

export function LiveQuizResults({
  results,
  strongAnswers,
  neutralAnswers,
  onRestart,
}: LiveQuizResultsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "compare">(
    "overview",
  );
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const visibleResults = showAll ? results : results.slice(0, 5);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 8) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const switchToCompare = useCallback(
    (id: string) => {
      setCompareIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setActiveTab("compare");
    },
    [],
  );

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[600px] border-4 border-foreground bg-card">
        {/* Header */}
        <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
          <h1 className="font-heading text-xl uppercase">Deine Ergebnisse</h1>
          <p className="mt-1 text-sm text-primary-foreground/60">
            {strongAnswers} klare Antworten
            {neutralAnswers > 0 &&
              `, ${neutralAnswers} neutrale (nicht gewertet)`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b-4 border-foreground">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 font-heading text-xs uppercase tracking-wider transition-colors ${
              activeTab === "overview"
                ? "bg-foreground text-primary-foreground"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`flex-1 py-3 font-heading text-xs uppercase tracking-wider transition-colors border-l-4 border-foreground ${
              activeTab === "compare"
                ? "bg-foreground text-primary-foreground"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            Vergleich{compareIds.size > 0 ? ` (${compareIds.size})` : ""}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "overview" ? (
          <div className="px-5 py-5 sm:px-8 flex flex-col gap-4">
            {visibleResults.map((result, i) => (
              <LiveResultCard
                key={result.group.id}
                result={result}
                rank={i + 1}
                isExpanded={expandedId === result.group.id}
                isCompareSelected={compareIds.has(result.group.id)}
                onToggleExpand={() => toggleExpand(result.group.id)}
                onToggleCompare={() => toggleCompare(result.group.id)}
                onSwitchToCompare={() => switchToCompare(result.group.id)}
              />
            ))}

            {!showAll && results.length > 5 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full border-2 border-foreground py-3 font-heading text-xs uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
              >
                Alle {results.length} Gruppen anzeigen
              </button>
            )}
          </div>
        ) : (
          <LiveCompareTab
            results={results}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
          />
        )}

        {/* Footer */}
        <div className="border-t-4 border-foreground px-6 py-5 sm:px-8 text-center">
          <button
            onClick={onRestart}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Quiz wiederholen
          </button>
        </div>
      </div>
    </div>
  );
}
