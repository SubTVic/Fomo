// SPDX-License-Identifier: AGPL-3.0-only
import Script from "next/script";

/**
 * Privacy-friendly Umami analytics. Renders the tracking script only when a
 * website id is configured via env, so dev/local builds stay clean.
 *
 * This is a SERVER component (rendered at build time in the static export),
 * so the env var does NOT need the NEXT_PUBLIC_ prefix. Accepted, in order:
 *
 *   UMAMI_WEBSITE_ID               the website UUID — same var the /report/
 *                                  build uses, so ONE variable powers both
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID   legacy name, still honoured
 *   UMAMI_SRC / NEXT_PUBLIC_UMAMI_SRC   script URL (defaults to Umami Cloud)
 *
 * Values are inlined at build time — a change needs a rebuild, consistent
 * with the rest of the static pipeline.
 */
export function UmamiScript() {
  const websiteId =
    process.env.UMAMI_WEBSITE_ID ?? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) return null;

  const src =
    process.env.UMAMI_SRC ??
    process.env.NEXT_PUBLIC_UMAMI_SRC ??
    "https://cloud.umami.is/script.js";

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      // Never record query strings in pageview URLs: the results link carries
      // the full encoded answer vector (?r=…) — without this, Umami would
      // store a second copy of every user's answers attached to the pageview.
      data-exclude-search="true"
      strategy="afterInteractive"
      defer
    />
  );
}
