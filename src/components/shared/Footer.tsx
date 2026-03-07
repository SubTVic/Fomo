// SPDX-License-Identifier: AGPL-3.0-only

import { YetiBadge } from "./YetiBadge";

export function Footer() {
  return (
    <footer className="w-full">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
        {/* Poster footer bar */}
        <div className="border-t-4 border-foreground py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>Ein</span>
            <YetiBadge className="text-foreground" />
            <strong className="text-foreground">Projekt</strong>
            <span className="text-border/30">&middot;</span>
            <span>
              powered by{" "}
              <a
                href="https://www.stura.tu-dresden.de"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:underline"
              >
                StuRa TU Dresden
              </a>
            </span>
          </div>
          <span>
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Open Source
            </a>
          </span>
        </div>

        {/* Tagline */}
        <p className="text-center text-xs text-muted-foreground tracking-wider pb-6 pt-2">
          Über 100 Hochschulgruppen. Eine Stadt. Ein Tool.
        </p>
      </div>
    </footer>
  );
}
