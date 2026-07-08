// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Group, QuizFilters, QuizItem, MatchResult } from "@/lib/types";
import { computeMatches, topWithTies, type UserAnswers } from "@/lib/matching";
import { encodeResults, decodeResults, readResultsParam } from "@/lib/results";
import { track, EVENTS } from "@/lib/analytics";
import { FilterScreen } from "./FilterScreen";
import { ItemScreen } from "./ItemScreen";
import { ResultsScreen } from "./ResultsScreen";

interface QuizFlowProps {
  items: QuizItem[];
  filters: QuizFilters;
  groups: Group[];
  lang?: "de" | "en";
}

type Phase = "filter" | "items" | "results";

/**
 * Orchestrates the whole client-side quiz: filter → one item per screen →
 * results. State lives only in React + the URL (no localStorage — SecurityError
 * risk in sandboxes, see CLAUDE.md). The finished result is encoded into the
 * URL (?r=…) so it can be saved/shared and restored. Matching runs in-browser.
 */
export function QuizFlow({ items, filters, groups, lang = "de" }: QuizFlowProps) {
  const [phase, setPhase] = useState<Phase>("filter");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [index, setIndex] = useState(0);

  // Restore a saved/shared result from the URL on first load.
  useEffect(() => {
    const r = readResultsParam();
    if (!r) return;
    const decoded = decodeResults(r, items, filters);
    if (decoded) {
      setAnswers(decoded.answers);
      setSelectedFilters(decoded.filters);
      setPhase("results");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches: MatchResult[] = useMemo(() => {
    if (phase !== "results") return [];
    return computeMatches(answers, selectedFilters, groups);
  }, [phase, answers, selectedFilters, groups]);

  const resultsParam = useMemo(
    () => (phase === "results" ? encodeResults(answers, selectedFilters, items, filters) : ""),
    [phase, answers, selectedFilters, items, filters],
  );

  // Keep the URL in sync with the shown results so refresh/back/share work.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = phase === "results" && resultsParam ? `?r=${resultsParam}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [phase, resultsParam]);

  // Per-question funnel: fires as each item is actually shown, not just once
  // at quiz-start/complete. Lets us see exactly where people drop off without
  // relying on an unreliable beforeunload hook.
  useEffect(() => {
    if (phase !== "items") return;
    track(EVENTS.quizItemView, { index, itemId: items[index]?.id, total: items.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  const answeredCount = Object.values(answers).filter((v) => v !== 0).length;

  function toggleFilter(attribute: string) {
    setSelectedFilters((prev) =>
      prev.includes(attribute) ? prev.filter((a) => a !== attribute) : [...prev, attribute],
    );
  }

  function startItems() {
    // Filter names are anonymous, canned category labels (not personal data) —
    // sending the actual selection (not just the count) captures interest even
    // for sessions that abandon before finishing the quiz.
    track(EVENTS.quizStart, {
      filters: selectedFilters.length ? selectedFilters.join(",") : "none",
      filterCount: selectedFilters.length,
    });
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
    // Anonymous research payload: one property per item (id → -1|0|1) plus the
    // selected multiple-choice filters. No identifier is attached; this only
    // leaves the browser if Umami is configured (see Datenschutz).
    const answerData: Record<string, number> = {};
    for (const item of items) answerData[item.id] = finalAnswers[item.id] ?? 0;
    track(EVENTS.quizResponse, {
      ...answerData,
      filters: selectedFilters.length ? selectedFilters.join(",") : "none",
      answered: nonNeutral,
    });
    // Which groups the quiz produced: one event per initially shown result
    // (top 5 incl. boundary ties — the same set ResultsScreen displays).
    // Fired only on a real completion — restoring a shared ?r= link does not
    // re-count.
    topWithTies(computeMatches(finalAnswers, selectedFilters, groups)).forEach((m, i) =>
      track(EVENTS.quizResultGroup, { group: m.group.slug, rank: i + 1, score: m.score }),
    );
    setPhase("results");
  }

  /** Back into the questions with everything preserved — cheaper than restart. */
  function editAnswers() {
    track(EVENTS.quizEdit);
    setIndex(0);
    setPhase("items");
  }

  function back() {
    if (index > 0) track(EVENTS.quizItemBack, { fromIndex: index });
    setIndex((i) => Math.max(0, i - 1));
  }

  function restart() {
    track(EVENTS.quizRestart);
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
        lang={lang}
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
        lang={lang}
      />
    );
  }

  return (
    <ResultsScreen
      matches={matches}
      answeredCount={answeredCount}
      itemCount={items.length}
      filters={filters}
      resultsParam={resultsParam}
      onRestart={restart}
      onEdit={editAnswers}
      lang={lang}
    />
  );
}
