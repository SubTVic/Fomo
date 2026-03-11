// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState, useCallback } from "react";
import type { LiveQuizState, AnswerValue } from "@/lib/live-quiz/types";
import { LIVE_QUESTIONS } from "@/lib/live-quiz/questions";
import { LIVE_GROUPS } from "@/lib/live-quiz/groups";
import { computeLiveMatches } from "@/lib/live-quiz/matching";
import { LiveQuizWelcome } from "./LiveQuizWelcome";
import { LiveQuizQuestion } from "./LiveQuizQuestion";
import { LiveQuizResults } from "./LiveQuizResults";

export function LiveQuizContainer() {
  const [state, setState] = useState<LiveQuizState>({
    phase: "welcome",
    currentIndex: 0,
    answers: new Array(LIVE_QUESTIONS.length).fill(null),
  });

  const currentQuestion = LIVE_QUESTIONS[state.currentIndex];
  const currentAnswer = state.answers[state.currentIndex];

  // Count answered (non-null, non-neutral) questions
  const answeredCount = state.answers.filter(
    (a) => a !== null && a.value !== null,
  ).length;

  const handleStart = useCallback(() => {
    setState((s) => ({ ...s, phase: "quiz" }));
  }, []);

  const handleAnswer = useCallback(
    (value: AnswerValue, doubleWeight: boolean) => {
      setState((s) => {
        const newAnswers = [...s.answers];
        newAnswers[s.currentIndex] = { value, doubleWeight };
        return { ...s, answers: newAnswers };
      });
    },
    [],
  );

  const handleNext = useCallback(() => {
    setState((s) => {
      if (s.currentIndex < LIVE_QUESTIONS.length - 1) {
        return { ...s, currentIndex: s.currentIndex + 1 };
      }
      return { ...s, phase: "results" };
    });
  }, []);

  const handlePrev = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: Math.max(0, s.currentIndex - 1),
    }));
  }, []);

  const handleSkip = useCallback(() => {
    setState((s) => {
      const newAnswers = [...s.answers];
      newAnswers[s.currentIndex] = { value: null, doubleWeight: false };
      const nextIndex = s.currentIndex + 1;
      if (nextIndex >= LIVE_QUESTIONS.length) {
        return { ...s, answers: newAnswers, phase: "results" };
      }
      return { ...s, answers: newAnswers, currentIndex: nextIndex };
    });
  }, []);

  const handleJumpTo = useCallback((index: number) => {
    setState((s) => ({ ...s, currentIndex: index }));
  }, []);

  const handleGoToResults = useCallback(() => {
    setState((s) => ({ ...s, phase: "results" }));
  }, []);

  const handleRestart = useCallback(() => {
    setState({
      phase: "welcome",
      currentIndex: 0,
      answers: new Array(LIVE_QUESTIONS.length).fill(null),
    });
  }, []);

  if (state.phase === "welcome") {
    return <LiveQuizWelcome onStart={handleStart} />;
  }

  if (state.phase === "results") {
    const results = computeLiveMatches(
      state.answers,
      LIVE_QUESTIONS,
      LIVE_GROUPS,
    );
    const strongAnswers = state.answers.filter(
      (a) => a !== null && a.value !== null && a.value !== "neutral",
    ).length;
    const neutralAnswers = state.answers.filter(
      (a) => a !== null && a.value === "neutral",
    ).length;

    return (
      <LiveQuizResults
        results={results}
        strongAnswers={strongAnswers}
        neutralAnswers={neutralAnswers}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <LiveQuizQuestion
      question={currentQuestion}
      questionIndex={state.currentIndex}
      totalQuestions={LIVE_QUESTIONS.length}
      answer={currentAnswer}
      answers={state.answers}
      answeredCount={answeredCount}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleSkip}
      onJumpTo={handleJumpTo}
      onGoToResults={handleGoToResults}
    />
  );
}
