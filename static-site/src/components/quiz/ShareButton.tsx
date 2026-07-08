// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { track, EVENTS } from "@/lib/analytics";

export function ShareButton() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    // 80% of the audience is on mobile — prefer the native share sheet
    // (WhatsApp & Co.) and fall back to copying the link on desktop.
    if (typeof navigator !== "undefined" && navigator.share) {
      track(EVENTS.resultsShareCopy, { method: "native" });
      try {
        await navigator.share({
          title: "FOMO",
          text: isEnglish ? "My student-group matches:" : "Meine Hochschulgruppen-Matches:",
          url,
        });
      } catch {
        // user dismissed the sheet — nothing to do
      }
      return;
    }
    track(EVENTS.resultsShareCopy, { method: "clipboard" });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="border-poster bg-card px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-surface"
    >
      {copied ? (isEnglish ? "Link copied" : "Link kopiert") : isEnglish ? "Share" : "Teilen"}
    </button>
  );
}
