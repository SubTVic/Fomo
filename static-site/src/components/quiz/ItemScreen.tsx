// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";
import type { QuizItem } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";

interface ItemScreenProps {
  item: QuizItem;
  index: number;
  total: number;
  currentValue: number | undefined;
  onAnswer: (value: number) => void;
  onBack: () => void;
  lang?: "de" | "en";
}

const OPTIONS: Array<{ value: number; de: string; en: string }> = [
  { value: 1, de: "Stimme zu", en: "Agree" },
  { value: 0, de: "Neutral", en: "Neutral" },
  { value: -1, de: "Stimme nicht zu", en: "Disagree" },
];

export function ItemScreen({
  item,
  index,
  total,
  currentValue,
  onAnswer,
  onBack,
  lang = "de",
}: ItemScreenProps) {
  const [picked, setPicked] = useState<number | undefined>(currentValue);
  const [selecting, setSelecting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setPicked(currentValue);
    setSelecting(false);
    setLeaving(false);
  }, [item.id, currentValue]);

  function choose(value: number) {
    if (selecting) return;
    setPicked(value);
    setSelecting(true);
    window.setTimeout(() => setLeaving(true), 140);
    window.setTimeout(() => onAnswer(value), 260);
  }

  return (
    <div
      className={`animate-fade-up transition-all duration-150 ease-out ${
        leaving ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
      key={item.id}
    >
      <ProgressBar current={index + 1} total={total} />

      <div className="mt-6 flex min-h-[140px] items-center border-poster bg-card p-5 sm:p-6">
        <p className="text-xl leading-snug text-navy [overflow-wrap:normal] [text-wrap:pretty] sm:text-2xl">
          {item.text}
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {OPTIONS.map((opt) => {
          const isOn = picked === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isOn}
              disabled={selecting}
              onClick={() => choose(opt.value)}
              className={`border-poster px-4 py-4 text-left text-lg font-medium transition-all duration-150 ${
                isOn ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
              } ${selecting && !isOn ? "opacity-45" : ""} ${isOn && selecting ? "translate-x-1" : ""}`}
            >
              <span className="min-w-0 [overflow-wrap:normal]">{lang === "en" ? opt.en : opt.de}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={index === 0 || selecting}
        className="mt-5 text-sm font-semibold uppercase tracking-wide text-body transition-colors enabled:hover:text-navy disabled:opacity-40"
      >
        {lang === "en" ? "Back" : "Zurück"}
      </button>
    </div>
  );
}
