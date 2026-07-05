// SPDX-License-Identifier: AGPL-3.0-only
import type { QuizFilters, QuizItem } from "@/lib/types";
import type { UserAnswers } from "@/lib/matching";

const endpoint =
  "https://script.google.com/macros/s/AKfycbwWM130hYXtvJ22Nw1fjP6GsZg2rKR2g0RnPwtId5vertY4KD3f-Evp1vwAc-UPjHx4/exec";

interface TrackQuizResponseInput {
  answers: UserAnswers;
  filters: string[];
  items: QuizItem[];
  quizFilters: QuizFilters;
}

export function trackQuizResponse({
  answers,
  filters,
  items,
  quizFilters,
}: TrackQuizResponseInput): void {
  if (typeof window === "undefined") return;

  const payload = {
    submittedAt: new Date().toISOString(),
    answers: items.map((item) => ({
      itemId: item.id,
      value: answers[item.id] ?? 0,
    })),
    filters: quizFilters.options
      .filter((option) => filters.includes(option.attribute))
      .map((option) => ({
        attribute: option.attribute,
        label: option.label,
      })),
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
