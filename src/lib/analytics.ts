// SPDX-License-Identifier: AGPL-3.0-only
// Umami custom event helpers. All calls are fire-and-forget.
// umami is injected globally via the script in layout.tsx.

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

function track(event: string, data?: Record<string, string | number | boolean>) {
  window.umami?.track(event, data);
}

export const analytics = {
  quizStarted(variant: string) {
    track("quiz_started", { variant });
  },

  quizCompleted(variant: string, durationSeconds: number, topScore: number) {
    track("quiz_completed", { variant, duration_seconds: durationSeconds, top_score: topScore });
  },

  resultCardExpanded(groupId: string) {
    track("result_card_expanded", { group_id: groupId });
  },

  comparisonOpened(groupAId: string, groupBId: string) {
    track("comparison_opened", { group_a_id: groupAId, group_b_id: groupBId });
  },

  externalLinkClicked(groupId: string, linkType: "website" | "instagram" | "email") {
    track("external_link_clicked", { group_id: groupId, link_type: linkType });
  },
};
