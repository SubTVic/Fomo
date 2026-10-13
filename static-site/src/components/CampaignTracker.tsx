// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useLayoutEffect } from "react";
import { EVENTS, track } from "@/lib/analytics";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

/** Keep only short, plain labels (lowercase, a-z0-9_-) — never free text. */
function clean(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return v || null;
}

/**
 * Counts arrivals via campaign links (e.g. Instagram ads: ?utm_source=instagram…).
 * Pageviews are recorded without query strings (data-exclude-search, protects
 * the ?r= answer vector), so UTM tags would otherwise be lost. Fires ONE
 * anonymous `campaign-visit` event with the cleaned labels.
 *
 * Reads the URL in a layout effect: those run before any passive effect, i.e.
 * before QuizFlow strips the query via history.replaceState. Then waits for
 * the deferred Umami script (up to ~10 s) before sending.
 */
export function CampaignTracker() {
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = clean(params.get(key));
      if (v) data[key.slice(4)] = v;
    }
    if (!data.source) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (window.umami || ++tries > 40) {
        window.clearInterval(timer);
        track(EVENTS.campaignVisit, { ...data, path: window.location.pathname });
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
