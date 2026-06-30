// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
          <Link href="/impressum" className="hover:text-navy">
            {isEnglish ? "Imprint" : "Impressum"}
          </Link>
          <Link href="/datenschutz" className="hover:text-navy">
            {isEnglish ? "Privacy" : "Datenschutz"}
          </Link>
        </div>
        <p className="text-xs text-muted">
          {isEnglish
            ? "Find your student group at TU Dresden. A project by YETI & StuRa. Matching runs entirely in your browser."
            : "Finde deine Hochschulgruppe an der TU Dresden. Ein Projekt von YETI & StuRa. Das Matching läuft komplett in deinem Browser."}
        </p>
      </div>
    </footer>
  );
}
