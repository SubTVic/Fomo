// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track, EVENTS } from "@/lib/analytics";

export function Navbar() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const normalizedPathname = pathname !== "/" ? pathname.replace(/\/$/, "") : pathname;
  // The switch is shown everywhere (internationals often land deep via a
  // shared link). German-only pages map to their closest English page.
  const showLanguageSwitch = true;
  const homeHref = isEnglish ? "/en" : "/";
  const germanHref = `${isEnglish ? stripEnglishPrefix(pathname) : pathname}${search}`;
  const englishHref = `${isEnglish ? pathname : toEnglishPath(normalizedPathname)}${search}`;

  return (
    <header className="w-full">
      <nav className="relative mx-auto flex max-w-[1000px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href={homeHref}
          className="shrink-0 border-poster bg-card px-3.5 py-1.5 font-heading text-[22px] text-navy"
          aria-label="FOMO Startseite"
        >
          FOMO
        </Link>

        {showLanguageSwitch && (
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 border-2 border-navy bg-card font-heading text-xs uppercase">
            <Link
              href={germanHref}
              aria-current={!isEnglish ? "page" : undefined}
              onClick={() => !isEnglish || track(EVENTS.langSwitch, { to: "de" })}
              className={`px-2.5 py-1.5 transition-colors ${
                !isEnglish ? "bg-navy text-sky" : "text-navy hover:bg-surface"
              }`}
            >
              DE
            </Link>
            <Link
              href={englishHref}
              aria-current={isEnglish ? "page" : undefined}
              onClick={() => isEnglish || track(EVENTS.langSwitch, { to: "en" })}
              className={`border-l-2 border-navy px-2.5 py-1.5 transition-colors ${
                isEnglish ? "bg-navy text-sky" : "text-navy hover:bg-surface"
              }`}
            >
              EN
            </Link>
          </div>
        )}

        <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <span className="hidden font-heading text-xs uppercase text-accent-muted sm:inline">
              Powered by
            </span>
            <a
              href="https://yeti-dresden.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YETI Dresden"
            >
              <img
                src="/logos/yeti.png"
                alt="YETI"
                width={2048}
                height={2045}
                className="h-7 w-auto object-contain sm:h-9"
              />
            </a>
            <span className="font-heading text-sm text-navy sm:text-base">x</span>
            <a
              href="https://www.stura.tu-dresden.de"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="StuRa TU Dresden"
            >
              <img
                src="/logos/stura-transparent.png"
                alt="StuRa"
                width={248}
                height={100}
                className="h-7 w-auto object-contain sm:h-9"
              />
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

function stripEnglishPrefix(pathname: string) {
  const stripped = pathname.replace(/^\/en/, "") || "/";
  return stripped;
}

/** DE path → its EN twin; pages without one fall back to the nearest EN page. */
function toEnglishPath(pathname: string) {
  // German-only pages (no /en twin — linking there would 404).
  if (pathname === "/impressum" || pathname === "/datenschutz") return "/en";
  if (pathname.startsWith("/groups/kategorie")) return "/en/groups";
  return `/en${pathname === "/" ? "" : pathname}`;
}
