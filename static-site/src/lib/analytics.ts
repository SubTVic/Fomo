// SPDX-License-Identifier: AGPL-3.0-only
// Thin wrapper around Umami's global `umami` object. Safe to call even when the
// script is absent (e.g. NEXT_PUBLIC_UMAMI_WEBSITE_ID unset in dev) — it just
// no-ops. No personal data is ever passed.

type UmamiFn = (event: string, data?: Record<string, unknown>) => void;

declare global {
  interface Window {
    umami?: { track: UmamiFn } | UmamiFn;
  }
}

export function track(event: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const u = window.umami;
  if (!u) return;
  try {
    if (typeof u === "function") u(event, data);
    else u.track(event, data);
  } catch {
    // analytics must never break the app
  }
}

export const EVENTS = {
  quizStart: "quiz-start",
  quizComplete: "quiz-complete",
  // Anonymous, aggregate research data: the 21 Likert answers + the selected
  // filters. No identifier, no personal data — only sent when Umami is enabled.
  quizResponse: "quiz-response",
  groupClick: "group-click",
} as const;
