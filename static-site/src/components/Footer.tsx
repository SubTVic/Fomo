// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t-4 border-navy">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-2 px-4 py-6 text-sm text-footer sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-heading text-navy">FOMO</span>
          <Link href="/" className="hover:text-navy">
            Start
          </Link>
          <Link href="/quiz" className="hover:text-navy">
            Quiz
          </Link>
          <Link href="/groups" className="hover:text-navy">
            Gruppen
          </Link>
        </div>
        <p className="text-xs text-muted">
          Finde deine Hochschulgruppe an der TU Dresden. Ein Projekt von YETI &amp; StuRa.
          Matching läuft komplett in deinem Browser — keine Daten verlassen dein Gerät.
        </p>
      </div>
    </footer>
  );
}
