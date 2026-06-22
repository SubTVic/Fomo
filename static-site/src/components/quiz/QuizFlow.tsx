// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useMemo, useState } from "react";
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
 * results. State lives in React + URL query params (no localStorage — see
 * CLAUDE.md). Encoding answers in the URL means navigating to a group detail
 * and hitting back returns the user to their ranked results.
 *
 * URL contract on the results phase:
 *   ?a=<one char per item, order matches items[]>  +=>+1 / 0=>0 / -=>-1
 *   ?f=<csv of filter attribute ids>               optional
 *   ?u=1                                           optional, include unverified
 */
export function QuizFlow({ items, filters, groups }: QuizFlowProps) {
  const [phase, setPhase] = useState<Phase>("filter");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [index, setIndex] = useState(0);

  // Reconstruct state from URL on first mount so /quiz?a=…&f=… lands directly
  // on the results screen (e.g. browser-back from a group detail page).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a");
    if (!a || a.length !== items.length) return;
    const parsed: UserAnswers = {};
    for (let i = 0; i < a.length; i++) {
      const c = a[i];
      parsed[items[i].id] = c === "+" ? 1 : c === "-" ? -1 : 0;
    }
    const f = params.get("f");
    setAnswers(parsed);
    setSelectedFilters(f ? f.split(",").filter(Boolean) : []);
    setPhase("results");
    // We intentionally do NOT depend on items — it's stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
    } else {
      finish({ ...answers, [item.id]: value });
    }
  }

  function finish(finalAnswers: UserAnswers) {
    const nonNeutral = Object.values(finalAnswers).filter((v) => v !== 0).length;
    track(EVENTS.quizComplete, { answered: nonNeutral, filters: selectedFilters.length });
    pushResultsUrl(items, finalAnswers, selectedFilters);
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
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", window.location.pathname);
    }
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

function pushResultsUrl(items: QuizItem[], answers: UserAnswers, filters: string[]) {
  if (typeof window === "undefined") return;
  const a = items
    .map((it) => {
      const v = answers[it.id] ?? 0;
      return v > 0 ? "+" : v < 0 ? "-" : "0";
    })
    .join("");
  const params = new URLSearchParams({ a });
  if (filters.length > 0) params.set("f", filters.join(","));
  window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
}
