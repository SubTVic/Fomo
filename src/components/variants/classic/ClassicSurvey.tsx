// SPDX-License-Identifier: AGPL-3.0-only
// Classic variant: Wahl-O-Mat-style, one question at a time with 3 large buttons
// In multi-variant mode, only shows the assigned blockQuestions

"use client";

import { useState, useCallback } from "react";
import { DimensionHeader } from "@/components/survey/DimensionHeader";
import type { SurveyVariantProps } from "@/components/variants/types";

// Maps Likert 1-5 to 3-option display (Zustimmung/Neutral/Ablehnung)
const CLASSIC_OPTIONS = [
  { label: "Stimme zu", value: "5" },
  { label: "Neutral", value: "3" },
  { label: "Stimme nicht zu", value: "1" },
];

export function ClassicSurvey({
  state,
  setAnswer,
  blockDimensions,
  blockQuestions,
  onBlockComplete,
}: SurveyVariantProps) {
  const { answers } = state;
  const [localIdx, setLocalIdx] = useState(0);

  const question = blockQuestions[localIdx] ?? blockQuestions[0];
  const currentValue = answers[question.id] as string | undefined;
  const isFirst = localIdx === 0;
  const isLast = localIdx === blockQuestions.length - 1;
  const dimension = blockDimensions.find((d) => d.id === question.dimensionId) ?? blockDimensions[0];

  const blockAnswered = blockQuestions.filter((q) => answers[q.id] !== undefined).length;
  const blockProgress = Math.round((blockAnswered / blockQuestions.length) * 100);

  // Position within dimension
  const dimIdx = blockDimensions.findIndex((d) => d.id === question.dimensionId) + 1;

  const advance = useCallback(() => {
    if (isLast) onBlockComplete();
    else setLocalIdx((i) => i + 1);
  }, [isLast, onBlockComplete]);

  function handleSelect(value: string) {
    setAnswer(question.id, value);
    setTimeout(advance, 350);
  }

  return (
    <div className="min-h-screen bg-[#FFCE00] flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-black/10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading text-xl uppercase border-2 border-current px-2 py-0.5">FOMO</span>
          <span className="text-sm font-medium tabular-nums">
            {localIdx + 1} / {blockQuestions.length}
          </span>
        </div>
        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300 rounded-full"
            style={{ width: `${blockProgress}%` }}
          />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col justify-between p-6 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-6 mt-4">
          <DimensionHeader
            dimension={dimension}
            dimIndex={dimIdx - 1}
            totalDimensions={blockDimensions.length}
            compact
          />
          <p className="text-xl font-bold leading-snug">&ldquo;{question.text}&rdquo;</p>

          <div className="flex flex-col gap-3">
            {CLASSIC_OPTIONS.map(({ label, value }) => {
              const isSelected = currentValue === value;
              return (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={`rounded-xl border-2 px-5 py-4 text-left font-bold transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? "bg-[#1a2a35] border-[#1a2a35] text-white"
                      : "bg-white/80 border-gray-300 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => handleSelect("0")}
              className={`rounded-xl border-2 border-dashed px-5 py-3 text-left transition-all duration-150 active:scale-[0.98] ${
                currentValue === "0"
                  ? "border-yellow-500 bg-yellow-100 text-yellow-900"
                  : "bg-white/60 border-yellow-400 hover:bg-yellow-50"
              }`}
            >
              <span className="text-sm font-medium">Ich hab die Frage nicht verstanden</span>
              <span className="block text-xs text-yellow-700/70 mt-0.5">
                Hilft uns, unklare Fragen zu verbessern
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-start mt-8">
          <button
            onClick={() => setLocalIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="text-sm font-medium opacity-60 hover:opacity-100 disabled:invisible"
          >
            ← Zurück
          </button>
        </div>
      </main>
    </div>
  );
}
