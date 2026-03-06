// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FOMO
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/groups" className="text-muted-foreground hover:text-foreground transition-colors">
            Alle Gruppen
          </Link>
          <Link href="/quiz" className="text-muted-foreground hover:text-foreground transition-colors">
            Quiz starten
          </Link>
        </nav>
      </div>
    </header>
  );
}
