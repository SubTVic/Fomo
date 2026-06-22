// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Share the current results URL. Uses the native share sheet on mobile, falls
 * back to copying the link. The URL already carries the encoded answers (?r=…),
 * so opening it restores the exact ranking.
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    track("results-share");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mein FOMO-Ergebnis", text: "Das passt zu mir an der TU Dresden:", url });
        return;
      }
    } catch {
      // user cancelled the share sheet — fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing else we can safely do
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="border-poster bg-sky px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-surface"
    >
      {copied ? "Link kopiert ✓" : "Teilen"}
    </button>
  );
}
