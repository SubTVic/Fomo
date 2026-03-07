// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { quizReducer, initialQuizState } from "@/lib/quiz-reducer";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";
import type { QuestionWithOptions } from "@/types";

interface QuizContainerProps {
  questions: QuestionWithOptions[];
}

export function QuizContainer({ questions }: QuizContainerProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);

  const currentQuestion = questions[state.currentIndex];
  const currentAnswer = currentQuestion ? state.answers[currentQuestion.id] : undefined;
  const isLast = state.currentIndex === questions.length - 1;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== "" && 
    !(Array.isArray(currentAnswer) && currentAnswer.length === 0);

  function handleNext() {
    if (isLast) {
      dispatch({ type: "COMPLETE" });
      // Pass answers via URL search params (no localStorage)
      const params = new URLSearchParams();
      for (const [id, val] of Object.entries(state.answers)) {
        params.set(id, Array.isArray(val) ? val.join(",") : val);
      }
      router.push(`/results?${params.toString()}`);
    } else {
      dispatch({ type: "NEXT" });
    }
  }

  function handleSkip() {
    if (!currentQuestion) return;
    if (isLast) {
      dispatch({ type: "COMPLETE" });
      const params = new URLSearchParams();
      for (const [id, val] of Object.entries(state.answers)) {
        params.set(id, Array.isArray(val) ? val.join(",") : val);
      }
      router.push(`/results?${params.toString()}`);
    } else {
      dispatch({ type: "SKIP", questionId: currentQuestion.id });
    }
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-8">
      <ProgressBar current={state.currentIndex + 1} total={questions.length} />

      <QuestionCard
        question={currentQuestion}
        value={currentAnswer}
        onChange={(value) => dispatch({ type: "ANSWER", questionId: currentQuestion.id, value })}
      />

      <div className="flex flex-col gap-3">
        <button
          onClick={handleNext}
          disabled={!hasAnswer}
          className="w-full bg-foreground py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[#2a3a45] disabled:opacity-40"
        >
          {isLast ? "Ergebnisse ansehen" : "Weiter"}
        </button>

        <div className="flex justify-between">
          {state.currentIndex > 0 ? (
            <button
              onClick={() => dispatch({ type: "PREV" })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Zurück
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Überspringen
          </button>
        </div>
      </div>

      {state.skipped.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {state.skipped.length} Frage{state.skipped.length > 1 ? "n" : ""} übersprungen – das
          Ergebnis wird etwas ungenauer.
        </p>
      )}
    </div>
  );
}
