// SPDX-License-Identifier: AGPL-3.0-only
// Final question: which layout variant did the user prefer?

"use client";

import { VARIANT_INFO } from "@/lib/pilot-variant-order";
import type { VariantKey } from "@/lib/pilot-variant-order";

const VARIANT_KEYS: VariantKey[] = ["scroll", "classic", "swipe", "chat"];

interface PreferenceQuestionProps {
  selected: string | null;
  reason: string;
  onSelect: (variant: string) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PreferenceQuestion({
  selected,
  reason,
  onSelect,
  onReasonChange,
  onSubmit,
  isSubmitting,
}: PreferenceQuestionProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          <span className="font-bold text-lg">FOMO Pilot</span>
          <span className="text-sm text-muted-foreground">Letzte Frage</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold">Welches Layout hat dir am besten gefallen?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Du hast alle 4 Varianten ausprobiert. Welche hat dir am meisten zugesagt?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {VARIANT_KEYS.map((key) => {
            const info = VARIANT_INFO[key];
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-3xl">{info.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold">{info.name}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
                {isSelected && (
                  <span className="text-primary font-bold text-lg">&#10003;</span>
                )}
              </button>
            );
          })}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-medium text-sm">Was hat dir daran gefallen? (optional)</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="z.B. schneller, intuitiver, mehr Spass..."
            className="rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <button
          onClick={onSubmit}
          disabled={!selected || isSubmitting}
          className="w-full rounded-xl bg-primary py-4 text-primary-foreground font-semibold text-lg disabled:opacity-50"
        >
          {isSubmitting ? "Wird gespeichert..." : "Antworten absenden"}
        </button>
      </main>
    </div>
  );
}
