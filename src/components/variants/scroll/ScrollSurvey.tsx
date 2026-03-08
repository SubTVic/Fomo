// SPDX-License-Identifier: AGPL-3.0-only
// Scroll variant: all questions of a dimension on one screen, dimension tabs on top
// In multi-variant mode, only shows the assigned blockDimensions/blockQuestions

"use client";

import { useState } from "react";
import { LikertBase } from "@/components/survey/question-inputs/LikertBase";
import type { SurveyVariantProps } from "@/components/variants/types";

export function ScrollSurvey({
  state,
  setAnswer,
  blockDimensions,
  blockQuestions,
  onBlockComplete,
}: SurveyVariantProps) {
  const { answers } = state;
  const [activeDimIdx, setActiveDimIdx] = useState(0);

  const currentDim = blockDimensions[activeDimIdx];
  const dimQuestions = currentDim ? blockQuestions.filter((q) => q.dimensionId === currentDim.id) : [];

  const dimAnswered = (dimId: string) =>
    blockQuestions.filter((q) => q.dimensionId === dimId).every((q) => answers[q.id] !== undefined);

  const blockAnswered = blockQuestions.filter((q) => answers[q.id] !== undefined).length;
  const blockProgress = Math.round((blockAnswered / blockQuestions.length) * 100);
  const allBlockAnswered = blockAnswered >= blockQuestions.length;

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Sticky header with dimension tabs */}
      <header className="sticky top-0 z-10 bg-[#f5f0e8]/95 backdrop-blur-sm border-b">
        <div className="mx-auto max-w-xl px-4 py-3 flex items-center justify-between">
          <span className="font-heading text-lg uppercase border-2 border-current px-2 py-0.5">FOMO</span>
          <span className="text-sm text-muted-foreground">
            {blockAnswered} / {blockQuestions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted/30 mx-4 mb-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${blockProgress}%` }}
          />
        </div>

        {/* Dimension tabs */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 px-4 pb-3 min-w-max">
            {blockDimensions.map((dim, i) => {
              const answered = dimAnswered(dim.id);
              const isActive = i === activeDimIdx;
              return (
                <button
                  key={dim.id}
                  onClick={() => setActiveDimIdx(i)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : answered
                        ? "bg-green-100 text-green-800"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{dim.emoji}</span>
                  <span className="hidden sm:inline">{dim.label.split("&")[0].trim()}</span>
                  <span className="sm:hidden">{dim.id}</span>
                  {answered && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Questions for current dimension */}
      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-6 flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-bold">
            {currentDim?.emoji} {currentDim?.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{currentDim?.description}</p>
        </div>

        {dimQuestions.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-3">
            <p className="font-medium leading-snug">
              <span className="text-muted-foreground text-sm mr-2">F{i + 1}</span>
              {q.text}
            </p>
            <LikertBase
              questionId={q.id}
              value={answers[q.id] as string | undefined}
              onChange={(v) => setAnswer(q.id, v)}
            />
          </div>
        ))}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <button
            onClick={() => setActiveDimIdx(activeDimIdx - 1)}
            disabled={activeDimIdx === 0}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-40"
          >
            ← Zurück
          </button>

          {activeDimIdx < blockDimensions.length - 1 ? (
            <button
              onClick={() => setActiveDimIdx(activeDimIdx + 1)}
              className="rounded-xl bg-primary px-6 py-2.5 text-primary-foreground text-sm font-semibold"
            >
              Weiter →
            </button>
          ) : (
            <button
              onClick={onBlockComplete}
              disabled={!allBlockAnswered}
              className="rounded-xl bg-primary px-6 py-2.5 text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              Abschnitt fertig →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
