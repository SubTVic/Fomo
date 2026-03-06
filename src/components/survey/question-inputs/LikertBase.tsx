// SPDX-License-Identifier: AGPL-3.0-only
// Base Likert 1–5 input, shared across all survey variants

"use client";

interface LikertBaseProps {
  questionId: string;
  value: string | undefined;
  onChange: (value: string) => void;
  labels?: [string, string]; // [disagree label, agree label]
  className?: string;
}

const LIKERT_LABELS = ["1", "2", "3", "4", "5"] as const;
const LIKERT_COLORS = [
  "bg-red-100 border-red-300 text-red-800 hover:bg-red-200",
  "bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200",
  "bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200",
  "bg-lime-100 border-lime-300 text-lime-800 hover:bg-lime-200",
  "bg-green-100 border-green-300 text-green-800 hover:bg-green-200",
];
const LIKERT_SELECTED = [
  "bg-red-500 border-red-500 text-white",
  "bg-orange-500 border-orange-500 text-white",
  "bg-yellow-500 border-yellow-500 text-white",
  "bg-lime-500 border-lime-500 text-white",
  "bg-green-500 border-green-500 text-white",
];

export function LikertBase({
  questionId,
  value,
  onChange,
  labels = ["Stimme gar nicht zu", "Stimme voll zu"],
  className = "",
}: LikertBaseProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {LIKERT_LABELS.map((label, i) => {
          const isSelected = value === label;
          return (
            <button
              key={label}
              onClick={() => onChange(label)}
              aria-label={`${questionId}: ${label} von 5`}
              aria-pressed={isSelected}
              className={`flex-1 rounded-lg border-2 py-3 text-sm font-bold transition-all duration-150 active:scale-95 ${
                isSelected ? LIKERT_SELECTED[i] : LIKERT_COLORS[i]
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  );
}
