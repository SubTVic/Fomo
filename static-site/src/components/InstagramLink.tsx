// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { ReactNode } from "react";
import { INSTAGRAM_URL } from "@/lib/site";
import { track, EVENTS } from "@/lib/analytics";

/** Outbound link to FOMO's Instagram account; counts clicks per placement. */
export function InstagramLink({
  context,
  className,
  children,
}: {
  context: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track(EVENTS.instagramClick, { context })}
      className={className}
    >
      {children}
    </a>
  );
}

/** Instagram glyph (simple outline), sized by the surrounding font. */
export function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[1.1em] w-[1.1em] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
