// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useMemo, useState } from "react";
import type { Group, QuizFilters, QuizItem, MatchResult } from "@/lib/types";
import { computeMatches, type UserAnswers } from "@/lib/matching";
import { track, EVENTS } from "@/lib/analytics";
import { FilterScreen } from "./FilterScreen";
import { ItemScreen } from "./ItemScreen";
import { ResultsScreen } from "./ResultsScreen";

interface QuizFlowProps {
  items: QuizItem[];
  filters: QuizFilters;
  groups: Group[];
}

type Phase = "filter" | "items" | "results";

/**
 * Orchestrates the whole client-side quiz: filter → one item per screen →
 * results. State lives only in React (no localStorage — SecurityError risk in
 * sandboxes, see CLAUDE.md). Matching runs in-browser; no data leaves the page.
 */
export function QuizFlow({ items, filters, groups }: QuizFlowProps) {
  const [phase, setPhase] = useState<Phase>("filter");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [index, setIndex] = useState(0);

  const matches: MatchResult[] = useMemo(() => {
    if (phase !== "results") return [];
    return computeMatches(answers, selectedFilters, groups);
  }, [phase, answers, selectedFilters, groups]);

  const answeredCount = Object.values(answers).filter((v) => v !== 0).length;

  function toggleFilter(attribute: string) {
    setSelectedFilters((prev) =>
      prev.includes(attribute) ? prev.filter((a) => a !== attribute) : [...prev, attribute],
    );
  }

  function startItems() {
    track(EVENTS.quizStart, { filters: selectedFilters.length });
    setPhase("items");
  }

  function answer(value: number) {
    const item = items[index];
    setAnswers((prev) => ({ ...prev, [item.id]: value }));
    // Auto-advance after a short beat so the selection is visible.
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
    } else {
      finish({ ...answers, [item.id]: value });
    }
  }

  function finish(finalAnswers: UserAnswers) {
    const nonNeutral = Object.values(finalAnswers).filter((v) => v !== 0).length;
    track(EVENTS.quizComplete, { answered: nonNeutral, filters: selectedFilters.length });
    setPhase("results");
  }

  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function restart() {
    setSelectedFilters([]);
    setAnswers({});
    setIndex(0);
    setPhase("filter");
  }

  if (phase === "filter") {
    return (
      <FilterScreen
        filters={filters}
        selected={selectedFilters}
        onToggle={toggleFilter}
        onStart={startItems}
      />
    );
  }

  if (phase === "items") {
    return (
      <ItemScreen
        item={items[index]}
        index={index}
        total={items.length}
        currentValue={answers[items[index].id]}
        onAnswer={answer}
        onBack={back}
      />
    );
  }

  return (
    <ResultsScreen matches={matches} answeredCount={answeredCount} onRestart={restart} />
  );
}
