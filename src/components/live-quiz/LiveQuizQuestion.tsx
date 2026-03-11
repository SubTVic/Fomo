// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useCallback } from "react";
import type { LiveQuestion, UserAnswer, AnswerValue } from "@/lib/live-quiz/types";

interface LiveQuizQuestionProps {
  question: LiveQuestion;
  questionIndex: number;
  totalQuestions: number;
  answer: UserAnswer | null;
  answers: (UserAnswer | null)[];
  answeredCount: number;
  onAnswer: (value: AnswerValue, doubleWeight: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onJumpTo: (index: number) => void;
  onGoToResults: () => void;
}

export function LiveQuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  answer,
  answers,
  answeredCount,
  onAnswer,
  onNext,
  onPrev,
  onSkip,
  onJumpTo,
  onGoToResults,
}: LiveQuizQuestionProps) {
  const currentValue = answer?.value ?? null;
  const isDoubleWeight = answer?.doubleWeight ?? false;
  const isLast = questionIndex === totalQuestions - 1;
  const percent = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  const handleVote = useCallback(
    (value: AnswerValue) => {
      onAnswer(value, isDoubleWeight);
      // Auto-advance after a short delay for visual feedback
      setTimeout(() => {
        if (questionIndex < totalQuestions - 1) {
          onNext();
        }
      }, 200);
    },
    [isDoubleWeight, onAnswer, onNext, questionIndex, totalQuestions],
  );

  const toggleDoubleWeight = useCallback(() => {
    if (answer) {
      onAnswer(answer.value, !answer.doubleWeight);
    } else {
      onAnswer(null, !isDoubleWeight);
    }
  }, [answer, isDoubleWeight, onAnswer]);

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[520px] border-4 border-foreground bg-card">
        {/* Progress header */}
        <div className="bg-foreground text-primary-foreground px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider">
            <span>
              Frage {questionIndex + 1} von {totalQuestions}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden bg-primary-foreground/20">
            <div
              className="h-full bg-primary-foreground transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="px-5 py-8 sm:px-8 flex flex-col gap-6">
          {/* Short title */}
          <h2 className="font-heading text-lg uppercase tracking-wide text-center">
            {question.shortTitle}
          </h2>

          {/* Thesis text */}
          <p className="text-center text-base text-muted-foreground leading-relaxed">
            {question.thesis}
          </p>

          {/* Vote buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleVote("agree")}
              className={`w-full py-3.5 font-heading text-sm uppercase tracking-wider border-2 border-foreground transition-all active:scale-[0.98] ${
                currentValue === "agree"
                  ? "bg-[#22c55e] text-white"
                  : "bg-card text-foreground hover:bg-[#22c55e]/10"
              }`}
            >
              Zustimmung
            </button>
            <button
              onClick={() => handleVote("neutral")}
              className={`w-full py-3.5 font-heading text-sm uppercase tracking-wider border-2 border-foreground transition-all active:scale-[0.98] ${
                currentValue === "neutral"
                  ? "bg-[#eab308] text-white"
                  : "bg-card text-foreground hover:bg-[#eab308]/10"
              }`}
            >
              Neutral
            </button>
            <button
              onClick={() => handleVote("disagree")}
              className={`w-full py-3.5 font-heading text-sm uppercase tracking-wider border-2 border-foreground transition-all active:scale-[0.98] ${
                currentValue === "disagree"
                  ? "bg-[#ef4444] text-white"
                  : "bg-card text-foreground hover:bg-[#ef4444]/10"
              }`}
            >
              Ablehnung
            </button>
          </div>

          {/* Double weight toggle */}
          <button
            onClick={toggleDoubleWeight}
            className={`flex items-center justify-center gap-2 py-2 text-sm transition-colors ${
              isDoubleWeight
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={isDoubleWeight ? "text-[#eab308]" : ""}>
              ★
            </span>
            <span>Doppelt werten</span>
          </button>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={onPrev}
              disabled={questionIndex === 0}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              Zurück
            </button>

            {isLast && currentValue !== null ? (
              <button
                onClick={onGoToResults}
                className="bg-foreground px-5 py-2.5 font-heading text-xs uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
              >
                Ergebnisse
              </button>
            ) : null}

            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Überspringen
            </button>
          </div>

          {/* Nav dots */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
            {answers.map((a, i) => {
              let bg = "bg-muted"; // unanswered
              if (a?.value === "agree") bg = "bg-[#22c55e]";
              else if (a?.value === "neutral") bg = "bg-[#eab308]";
              else if (a?.value === "disagree") bg = "bg-[#ef4444]";
              else if (a?.value === null) bg = "bg-muted-foreground/30"; // skipped

              return (
                <button
                  key={i}
                  onClick={() => onJumpTo(i)}
                  className={`h-3 w-3 transition-all ${bg} ${
                    i === questionIndex
                      ? "ring-2 ring-foreground ring-offset-1 ring-offset-card"
                      : ""
                  }`}
                  aria-label={`Frage ${i + 1}`}
                />
              );
            })}
          </div>

          {/* Go to results shortcut */}
          {answeredCount >= 1 && !isLast && (
            <button
              onClick={onGoToResults}
              className="text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Direkt zu Ergebnissen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
