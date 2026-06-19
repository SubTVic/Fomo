// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";

export function Navbar() {
  return (
    <header className="w-full">
      <nav className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="border-poster bg-card px-3.5 py-1.5 font-heading text-[22px] text-navy"
          aria-label="FOMO Startseite"
        >
          FOMO
        </Link>
        <div className="flex items-center gap-4 text-sm font-semibold uppercase tracking-wide">
          <Link href="/groups" className="text-body transition-colors hover:text-navy">
            Gruppen
          </Link>
          <Link
            href="/quiz"
            className="border-poster bg-navy px-3 py-1.5 text-sky transition-colors hover:bg-navy-hover"
          >
            Quiz
          </Link>
        </div>
      </nav>
    </header>
  );
}
