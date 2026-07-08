// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuizFilters } from "@/lib/types";

interface FilterScreenProps {
  filters: QuizFilters;
  selected: string[];
  onToggle: (attribute: string) => void;
  onStart: () => void;
  lang?: "de" | "en";
}

export function FilterScreen({ filters, selected, onToggle, onStart, lang = "de" }: FilterScreenProps) {
  const title =
    lang === "en" ? "What would you mainly like to do in your student group?" : filters.question;

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl text-navy sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-body">
        {lang === "en"
          ? "Optional. If you pick something, we only show groups that offer it — leave everything unselected to keep all options open."
          : "Optional. Wenn du etwas auswählst, zeigen wir dir nur Gruppen, die das anbieten — ohne Auswahl bleibt alles offen."}
      </p>

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
              <span className="min-w-0 break-words font-medium">{opt.label}</span>
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
        {lang === "en"
          ? selected.length > 0
            ? `Start (${selected.length} selected)`
            : "Start"
          : selected.length > 0
            ? `Los geht's (${selected.length} gewählt)`
            : "Los geht's"}
      </button>
    </div>
  );
}
