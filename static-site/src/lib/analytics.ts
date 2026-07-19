// SPDX-License-Identifier: AGPL-3.0-only
// Thin wrapper around Umami's global `umami` object. Safe to call even when the
// script is absent (e.g. UMAMI_WEBSITE_ID unset in dev) — it just
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
  // Fired once per item screen shown — builds a per-question funnel
  // (index 0..20) so drop-off per question is visible without needing an
  // unreliable beforeunload/visibilitychange hook.
  quizItemView: "quiz-item-view",
  quizItemBack: "quiz-item-back",
  quizComplete: "quiz-complete",
  // Anonymous, aggregate research data: the 21 Likert answers + the selected
  // filters. No identifier, no personal data — only sent when Umami is enabled.
  quizResponse: "quiz-response",
  // One event per group shown in the top results (rank + score) — makes
  // "which groups come out of the quiz, how often?" a simple frequency table
  // in the Umami UI (event → property "group").
  quizResultGroup: "quiz-result-group",
  quizEdit: "quiz-edit",
  quizRestart: "quiz-restart",
  groupClick: "group-click",
  groupDetailOpen: "group-detail-open",
  resultsTab: "results-tab",
  resultsShowMore: "results-show-more",
  resultsZeroHits: "results-zero-hits",
  resultsFeedback: "results-feedback",
  resultsShareCopy: "results-share-copy",
  // Voluntary, anonymous: "already a member of a group? which one?" plus the
  // rank OUR ranking gave that group — the self-recognition metric (does the
  // algorithm find your own group?) collected passively instead of a study.
  selfRecognition: "self-recognition",
  groupsCategoryFilter: "groups-category-filter",
  groupsShowUnverified: "groups-show-unverified",
  // Click on "register your group" (outbound to the dynamic registration app).
  registerClick: "register-click",
  langSwitch: "lang-switch",
} as const;
