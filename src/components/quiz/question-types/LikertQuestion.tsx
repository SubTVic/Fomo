// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuestionWithOptions } from "@/types";

interface Props {
  question: QuestionWithOptions;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
}

const LABELS = ["Stimme gar nicht zu", "", "", "", "Stimme voll zu"];

export function LikertQuestion({ question, value, onChange }: Props) {
  const selected = typeof value === "string" ? value : undefined;

  return (
    <div className="flex flex-col gap-4">
      {question.helpText && (
        <p className="text-sm text-muted-foreground">{question.helpText}</p>
      )}
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(String(v))}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
              selected === String(v)
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary/50"
            }`}
            aria-label={`${v} – ${LABELS[v - 1]}`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{LABELS[0]}</span>
        <span>{LABELS[4]}</span>
      </div>
    </div>
  );
}
