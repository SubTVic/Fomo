// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuizItem } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";

interface ItemScreenProps {
  item: QuizItem;
  index: number; // 0-based
  total: number;
  currentValue: number | undefined;
  onAnswer: (value: number) => void;
  onBack: () => void;
}

const OPTIONS: Array<{ value: number; label: string; emoji: string }> = [
  { value: -1, label: "Stimme nicht zu", emoji: "👎" },
  { value: 0, label: "Neutral", emoji: "🤷" },
  { value: 1, label: "Stimme zu", emoji: "👍" },
];

/** One Likert item per screen. Selecting an option auto-advances (handled by parent). */
export function ItemScreen({
  item,
  index,
  total,
  currentValue,
  onAnswer,
  onBack,
}: ItemScreenProps) {
  return (
    <div className="animate-fade-up" key={item.id}>
      <ProgressBar current={index + 1} total={total} />

      <div className="mt-6 flex min-h-[140px] items-center border-poster bg-card p-6">
        <p className="text-xl text-navy sm:text-2xl">{item.text}</p>
      </div>

      <div className="mt-5 grid gap-3">
        {OPTIONS.map((opt) => {
          const isOn = currentValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isOn}
              onClick={() => onAnswer(opt.value)}
              className={`flex items-center gap-3 border-poster px-4 py-4 text-left text-lg font-medium transition-colors ${
                isOn ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {opt.emoji}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={index === 0}
        className="mt-5 text-sm font-semibold uppercase tracking-wide text-body transition-colors enabled:hover:text-navy disabled:opacity-40"
      >
        ← Zurück
      </button>
    </div>
  );
}
