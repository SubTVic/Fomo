// SPDX-License-Identifier: AGPL-3.0-only
// Base 3-option Likert input (Agree / Neutral / Disagree), shared across variants

"use client";

interface LikertBaseProps {
  questionId: string;
  value: string | undefined;
  onChange: (value: string) => void;
  className?: string;
}

const LIKERT_OPTIONS = [
  { value: "1", label: "Stimme nicht zu", icon: "✗", color: "bg-red-100 border-red-300 text-red-800 hover:bg-red-200", selected: "bg-red-500 border-red-500 text-white" },
  { value: "3", label: "Neutral", icon: "─", color: "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200", selected: "bg-gray-500 border-gray-500 text-white" },
  { value: "5", label: "Stimme zu", icon: "✓", color: "bg-green-100 border-green-300 text-green-800 hover:bg-green-200", selected: "bg-green-500 border-green-500 text-white" },
] as const;

const NOT_UNDERSTOOD = { value: "0", label: "Nicht verstanden", icon: "?", color: "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100", selected: "bg-yellow-500 border-yellow-500 text-white" } as const;

export function LikertBase({
  questionId,
  value,
  onChange,
  className = "",
}: LikertBaseProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {LIKERT_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              aria-label={`${questionId}: ${opt.label}`}
              aria-pressed={isSelected}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-sm font-bold transition-all duration-150 active:scale-95 ${
                isSelected ? opt.selected : opt.color
              }`}
            >
              <span className="text-base">{opt.icon}</span>
              <span className="text-xs">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onChange(NOT_UNDERSTOOD.value)}
        aria-label={`${questionId}: ${NOT_UNDERSTOOD.label}`}
        aria-pressed={value === NOT_UNDERSTOOD.value}
        className={`w-full flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-xs font-medium transition-all duration-150 active:scale-95 ${
          value === NOT_UNDERSTOOD.value ? NOT_UNDERSTOOD.selected : NOT_UNDERSTOOD.color
        }`}
      >
        <span>{NOT_UNDERSTOOD.icon}</span>
        <span>{NOT_UNDERSTOOD.label}</span>
      </button>
    </div>
  );
}
