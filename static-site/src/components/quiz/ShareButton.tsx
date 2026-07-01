// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { track, EVENTS } from "@/lib/analytics";

export function ShareButton() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    track(EVENTS.resultsShareCopy);
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
      onClick={copyLink}
      className="border-poster bg-card px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-surface"
    >
      {copied ? (isEnglish ? "Link copied" : "Link kopiert") : isEnglish ? "Share" : "Teilen"}
    </button>
  );
}
