// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuestionWithOptions } from "@/types";

interface Props {
  question: QuestionWithOptions;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
}

export function SliderQuestion({ question, value, onChange }: Props) {
  const min = question.sliderMin ?? 0;
  const max = question.sliderMax ?? 100;
  const step = question.sliderStep ?? 1;
  const current = typeof value === "string" ? Number(value) : Math.round((min + max) / 2);

  return (
    <div className="flex flex-col gap-4">
      {question.helpText && (
        <p className="text-sm text-muted-foreground">{question.helpText}</p>
      )}
      <div className="text-center text-3xl font-bold tabular-nums">{current}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{question.sliderMinLabel ?? String(min)}</span>
        <span>{question.sliderMaxLabel ?? String(max)}</span>
      </div>
    </div>
  );
}
