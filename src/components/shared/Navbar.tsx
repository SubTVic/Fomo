// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { YetiBadge } from "./YetiBadge";

export function Navbar() {
  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-heading text-[22px] uppercase border-[3px] border-foreground px-3.5 py-1.5">
          FOMO
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/groups"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Alle Gruppen
          </Link>
          <span className="text-muted-foreground">|</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <YetiBadge />
            <span>YETI</span>
            <span className="text-muted-foreground mx-1">&times;</span>
            <span>StuRa</span>
          </div>
        </div>
      </div>
    </header>
  );
}
