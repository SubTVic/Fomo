// SPDX-License-Identifier: AGPL-3.0-only
import Script from "next/script";

/**
 * Privacy-friendly Umami analytics. Renders the tracking script only when a
 * website id is configured via env, so dev/local builds stay clean. The Umami
 * account/website id does not exist yet — set these in Vercel/host env later:
 *
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID   the website UUID (required to enable)
 *   NEXT_PUBLIC_UMAMI_SRC          script URL (defaults to Umami Cloud)
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so a value change needs a
 * rebuild — consistent with the rest of the static pipeline.
 */
export function UmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) return null;

  const src = process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
      defer
    />
  );
}
