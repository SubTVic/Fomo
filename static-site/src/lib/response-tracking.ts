// SPDX-License-Identifier: AGPL-3.0-only
import type { MatchResult, QuizFilters, QuizItem } from "@/lib/types";
import type { UserAnswers } from "@/lib/matching";

const endpoint =
  "https://script.google.com/macros/s/AKfycbz7akPcoybZfcGePIOBlnP-29dm_8BaiYS9MZKspmHkW3s2vRBBM8zElef62jKCVHZ-/exec";

interface TrackQuizResponseInput {
  answers: UserAnswers;
  filters: string[];
  items: QuizItem[];
  matches: MatchResult[];
  quizFilters: QuizFilters;
  resultsParam: string;
}

export function trackQuizResponse({
  answers,
  filters,
  items,
  matches,
  quizFilters,
  resultsParam,
}: TrackQuizResponseInput): void {
  if (typeof window === "undefined") return;

  const readableAnswers = items.map((item) => {
    const value = answers[item.id] ?? 0;
    return {
      itemId: item.id,
      shortTitle: item.shortTitle,
      question: item.text,
      value,
      label: answerLabel(value),
    };
  });

  const selectedFilters = quizFilters.options
    .filter((option) => filters.includes(option.attribute))
    .map((option) => ({
      attribute: option.attribute,
      label: option.label,
    }));

  const topMatches = matches
    .filter((match) => match.score > 0)
    .slice(0, 10)
    .map((match, index) => ({
      rank: index + 1,
      groupId: match.group.id,
      name: match.group.name,
      slug: match.group.slug,
      score: match.score,
      category: match.group.categoryName,
    }));

  const resultUrl = `${window.location.origin}${window.location.pathname}${
    resultsParam ? `?r=${resultsParam}` : ""
  }`;
  const topMatch = topMatches[0] ?? null;

  const payload = {
    submittedAt: new Date().toISOString(),
    topMatchName: topMatch?.name ?? "",
    topMatchScore: topMatch?.score ?? "",
    topMatches,
    answers: readableAnswers,
    answersReadable: readableAnswers
      .map((answer) => `${answer.itemId} ${answer.shortTitle}: ${answer.label}`)
      .join(" | "),
    filters: selectedFilters,
    filtersReadable: selectedFilters.map((filter) => filter.label).join(", "),
    resultsParam,
    resultUrl,
  };

  const body = JSON.stringify(payload);

  try {
    void fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body,
    }).catch(() => {
      if (!navigator.sendBeacon) return;
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      navigator.sendBeacon(endpoint, blob);
    });
  } catch {
    // Response tracking must never block showing the result.
  }
}

function answerLabel(value: number): string {
  if (value > 0) return "Stimme zu";
  if (value < 0) return "Stimme nicht zu";
  return "Neutral";
}
