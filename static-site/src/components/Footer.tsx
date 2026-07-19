// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_SEO } from "@/lib/categories";
import { REGISTER_URL } from "@/lib/site";
import { track, EVENTS } from "@/lib/analytics";

export function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const prefix = isEnglish ? "/en" : "";

  return (
    <footer className="mt-auto w-full border-t-4 border-navy">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-2 px-4 py-6 text-sm text-footer sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-heading text-navy">FOMO</span>
          <Link href={`${prefix}/`} className="hover:text-navy">
            {isEnglish ? "Home" : "Start"}
          </Link>
          <Link href={`${prefix}/quiz`} className="hover:text-navy">
            Quiz
          </Link>
          <Link href={`${prefix}/groups`} className="hover:text-navy">
            {isEnglish ? "Groups" : "Gruppen"}
          </Link>
          <a
            href={REGISTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(EVENTS.registerClick, { context: "footer" })}
            className="hover:text-navy"
          >
            {isEnglish ? "Register your group" : "Gruppe registrieren"}
          </a>
          <Link href="/impressum" className="hover:text-navy">
            {isEnglish ? "Imprint" : "Impressum"}
          </Link>
          <Link href="/datenschutz" className="hover:text-navy">
            {isEnglish ? "Privacy" : "Datenschutz"}
          </Link>
        </div>
        {/* Discreet, crawlable links to the SEO category pages. Deliberately in
            the footer: they are entry doors for search engines, NOT a second
            browsing UI (the one browse surface is /groups). German only. */}
        {!isEnglish && (
          <p className="text-xs text-muted">
            {CATEGORY_SEO.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " · "}
                <Link
                  href={`/groups/kategorie/${c.slug}/`}
                  className="underline-offset-4 hover:text-navy hover:underline"
                >
                  {c.categoryName}
                </Link>
              </span>
            ))}
          </p>
        )}
        <p className="text-xs text-muted">
          {isEnglish
            ? "Find your student group at TU Dresden. A project by YETI & StuRa. Matching runs entirely in your browser."
            : "Finde deine Hochschulgruppe an der TU Dresden. Ein Projekt von YETI & StuRa. Das Matching läuft komplett in deinem Browser."}
        </p>
      </div>
    </footer>
  );
}
