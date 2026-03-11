// SPDX-License-Identifier: AGPL-3.0-only
"use client";

interface LiveQuizWelcomeProps {
  onStart: () => void;
}

export function LiveQuizWelcome({ onStart }: LiveQuizWelcomeProps) {
  return (
    <div className="flex flex-col items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-[520px] border-4 border-foreground bg-card">
        {/* Header */}
        <div className="bg-foreground text-primary-foreground px-6 py-6 sm:px-8 text-center">
          <h1 className="font-heading text-3xl uppercase tracking-wide">
            FOMO
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Find Our Matching Organizations
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-8 sm:px-8 flex flex-col gap-6">
          <p className="text-base text-foreground leading-relaxed">
            Finde heraus, welche Hochschulgruppen an der TU Dresden zu dir
            passen. Beantworte 20 kurze Thesen — wir matchen dich mit den
            besten Gruppen.
          </p>

          {/* How it works */}
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-sm uppercase tracking-wider">
              So funktioniert&apos;s
            </h2>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-foreground bg-[#22c55e] text-xs font-bold text-white">
                  +
                </span>
                <span>
                  <strong className="text-foreground">Zustimmung</strong> — Du
                  stimmst der These zu
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-foreground bg-[#eab308] text-xs font-bold text-white">
                  ●
                </span>
                <span>
                  <strong className="text-foreground">Neutral</strong> — Ist
                  dir egal (wird nicht gezählt)
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-foreground bg-[#ef4444] text-xs font-bold text-white">
                  −
                </span>
                <span>
                  <strong className="text-foreground">Ablehnung</strong> — Du
                  lehnst die These ab
                </span>
              </div>
            </div>
          </div>

          {/* Meta info */}
          <p className="text-center text-xs text-muted-foreground tracking-wider">
            ~ 3 Min &middot; Anonym &middot; Keine Daten gespeichert
          </p>

          {/* CTA */}
          <button
            onClick={onStart}
            className="w-full bg-foreground py-4 font-heading text-base uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[#2a3a45] active:scale-[0.98]"
          >
            Quiz starten
          </button>
        </div>
      </div>
    </div>
  );
}
