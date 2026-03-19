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
  { value: "1", label: "Stimme nicht zu" },
  { value: "3", label: "Neutral" },
  { value: "5", label: "Stimme zu" },
] as const;

const NOT_UNDERSTOOD = { value: "0", label: "Nicht verstanden", color: "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100", selected: "bg-yellow-500 border-yellow-500 text-white" } as const;

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
              className={`flex-1 rounded-lg border-2 py-3 text-xs font-bold transition-all duration-150 active:scale-95 ${
                isSelected
                  ? "bg-[#1a2a35] border-[#1a2a35] text-white"
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onChange(NOT_UNDERSTOOD.value)}
        aria-label={`${questionId}: ${NOT_UNDERSTOOD.label}`}
        aria-pressed={value === NOT_UNDERSTOOD.value}
        className={`w-full rounded-lg border-2 border-dashed px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.98] ${
          value === NOT_UNDERSTOOD.value
            ? "border-yellow-500 bg-yellow-100 text-yellow-900"
            : "border-yellow-300 bg-yellow-50/50 text-yellow-800 hover:bg-yellow-50"
        }`}
      >
        <span className="text-sm font-medium">Ich hab die Frage nicht verstanden</span>
        <span className="block text-[11px] text-yellow-700/70 mt-0.5">
          Hilft uns, unklare Fragen zu verbessern
        </span>
      </button>
    </div>
  );
}
