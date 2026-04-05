// SPDX-License-Identifier: AGPL-3.0-only
// Shared survey state hook used by all UI variants

"use client";

import { useState, useCallback } from "react";
import type { SurveyQuestion, SurveyDimension } from "@/components/variants/types";

export type SurveyPhase = "questions" | "done";

export interface SurveyState {
  answers: Record<string, string | string[]>;
  currentQuestionIndex: number;
  phase: SurveyPhase;
  startTime: number;
}

const initialState: SurveyState = {
  answers: {},
  currentQuestionIndex: 0,
  phase: "questions",
  startTime: Date.now(),
};

export function useSurveyState(questions: SurveyQuestion[], dimensions: SurveyDimension[]) {
  const [state, setState] = useState<SurveyState>(initialState);

  const setAnswer = useCallback((questionId: string, value: string | string[]) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, questions.length - 1));
    setState((prev) => ({ ...prev, currentQuestionIndex: clamped }));
  }, [questions.length]);

  const goToDimension = useCallback((dimIndex: number) => {
    const dim = dimensions[dimIndex];
    if (!dim) return;
    const firstIdx = questions.findIndex((q) => q.dimensionId === dim.id);
    if (firstIdx >= 0) {
      setState((prev) => ({ ...prev, currentQuestionIndex: firstIdx }));
    }
  }, [questions, dimensions]);

  const setPhase = useCallback((phase: SurveyPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.currentQuestionIndex < questions.length - 1) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
      }
      return { ...prev, phase: "done" };
    });
  }, [questions.length]);

  const prev = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  }, []);

  // Derived values
  const totalAnswered = Object.keys(state.answers).length;
  const progress = questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;
  const EMPTY_QUESTION: SurveyQuestion = { id: "__none__", dimensionId: null, text: "" };
  const currentQuestion: SurveyQuestion =
    questions[state.currentQuestionIndex] ?? questions[0] ?? EMPTY_QUESTION;
  const currentDimension: SurveyDimension | undefined = currentQuestion.dimensionId
    ? dimensions.find((d) => d.id === currentQuestion.dimensionId) ?? dimensions[0]
    : dimensions[0];
  const currentDimIndex = dimensions.findIndex((d) => d.id === currentDimension?.id);

  return {
    state,
    setState,
    setAnswer,
    goToQuestion,
    goToDimension,
    setPhase,
    next,
    prev,
    totalAnswered,
    progress,
    currentQuestion,
    currentDimension,
    currentDimIndex,
  };
}

export type UseSurveyStateReturn = ReturnType<typeof useSurveyState>;
