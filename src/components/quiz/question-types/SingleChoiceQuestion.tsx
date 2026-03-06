// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuestionWithOptions } from "@/types";

interface Props {
  question: QuestionWithOptions;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
}

export function SingleChoiceQuestion({ question, value, onChange }: Props) {
  const selected = typeof value === "string" ? value : undefined;

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.value)}
          className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
            selected === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:border-primary/50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
