// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuizFilters } from "@/lib/types";

interface FilterScreenProps {
  filters: QuizFilters;
  selected: string[];
  onToggle: (attribute: string) => void;
  onStart: () => void;
}

/**
 * Optional multi-select filter screen. Selections are attribute ids that feed
 * the matching hard constraint. Empty = "alles offen".
 */
export function FilterScreen({ filters, selected, onToggle, onStart }: FilterScreenProps) {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl text-navy sm:text-3xl">{filters.question}</h1>
      <p className="mt-2 text-sm text-body">{filters.subtitle}</p>

      <div className="mt-5 grid gap-3">
        {filters.options.map((opt) => {
          const isOn = selected.includes(opt.attribute);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggle(opt.attribute)}
              className={`flex items-center justify-between gap-3 border-poster px-4 py-4 text-left transition-colors ${
                isOn ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 text-sm font-bold ${
                  isOn ? "border-sky bg-sky text-navy" : "border-navy"
                }`}
                aria-hidden
              >
                {isOn ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-6 w-full border-poster bg-navy px-6 py-4 font-heading text-lg text-sky transition-colors hover:bg-navy-hover"
      >
        {selected.length > 0 ? `Los geht's (${selected.length} gewählt) →` : "Los geht's →"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Du kannst auch ohne Auswahl starten.
      </p>
    </div>
  );
}
