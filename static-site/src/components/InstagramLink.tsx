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

/** Official Instagram app icon (decorative; the link text names the target). */
export function InstagramIcon() {
  return (
    <img
      src="/logos/instagram.png"
      alt=""
      width={96}
      height={96}
      className="h-[1.6em] w-[1.6em] shrink-0"
    />
  );
}

/** "@fomo_dresden" in the body font: Archivo Black renders "@" oddly. */
export function InstagramHandle() {
  return <span className="font-body font-semibold">@fomo_dresden</span>;
}
