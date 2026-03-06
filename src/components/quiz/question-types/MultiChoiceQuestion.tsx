// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuestionWithOptions } from "@/types";

interface Props {
  question: QuestionWithOptions;
  value: string | string[] | undefined;
  onChange: (value: string[]) => void;
}

export function MultiChoiceQuestion({ question, value, onChange }: Props) {
  const selected: string[] = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",").filter(Boolean)
    : [];

  function toggle(v: string) {
    const next = selected.includes(v)
      ? selected.filter((s) => s !== v)
      : [...selected, v];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Mehrfachauswahl möglich</p>
      {question.options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.id}
            onClick={() => toggle(option.value)}
            className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary/50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
