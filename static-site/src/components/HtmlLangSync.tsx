// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * The static export has a single root <html lang="de">  — there is no nested
 * layout per locale to set it per-route. Without this, English pages (/en/*)
 * would keep announcing "de" to screen readers and search engines, which is
 * both an accessibility bug and a (minor) SEO signal mismatch. Corrects the
 * attribute client-side right after mount/navigation.
 */
export function HtmlLangSync() {
  const pathname = usePathname();

  useEffect(() => {
    const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
    document.documentElement.lang = isEnglish ? "en" : "de";
  }, [pathname]);

  return null;
}
