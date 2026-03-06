// SPDX-License-Identifier: AGPL-3.0-only
// Shared survey state hook used by all UI variants

"use client";

import { useState, useCallback } from "react";
import { PILOT_QUESTIONS, DIMENSIONS, getDimension } from "@/lib/pilot-questions";
import type { PilotQuestion, Dimension } from "@/lib/pilot-questions";

export interface SurveyDemographic {
  semester: string | null;
  isMember: string | null; // "yes" | "no" | "was"
  groupNames: string | null;
}

export interface SurveyFeedback {
  confusing: string;
  missing: string;
}

export type SurveyPhase = "questions" | "demographic" | "feedback" | "preference" | "done";

export interface SurveyState {
  answers: Record<string, string | string[]>;
  currentQuestionIndex: number; // 0-59
  phase: SurveyPhase;
  startTime: number;
  demographic: SurveyDemographic;
  feedback: SurveyFeedback;
  preferredVariant: string | null;
  preferenceReason: string;
}

const initialState: SurveyState = {
  answers: {},
  currentQuestionIndex: 0,
  phase: "questions",
  startTime: Date.now(),
  demographic: { semester: null, isMember: null, groupNames: null },
  feedback: { confusing: "", missing: "" },
  preferredVariant: null,
  preferenceReason: "",
};

export function useSurveyState() {
  const [state, setState] = useState<SurveyState>(initialState);

  const setAnswer = useCallback((questionId: string, value: string | string[]) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const setDemographic = useCallback((field: keyof SurveyDemographic, value: string) => {
    setState((prev) => ({
      ...prev,
      demographic: { ...prev.demographic, [field]: value },
    }));
  }, []);

  const setFeedback = useCallback((field: keyof SurveyFeedback, value: string) => {
    setState((prev) => ({
      ...prev,
      feedback: { ...prev.feedback, [field]: value },
    }));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, PILOT_QUESTIONS.length - 1));
    setState((prev) => ({ ...prev, currentQuestionIndex: clamped }));
  }, []);

  const goToDimension = useCallback((dimIndex: number) => {
    const dim = DIMENSIONS[dimIndex];
    if (!dim) return;
    const firstIdx = PILOT_QUESTIONS.findIndex((q) => q.dimensionId === dim.id);
    if (firstIdx >= 0) {
      setState((prev) => ({ ...prev, currentQuestionIndex: firstIdx }));
    }
  }, []);

  const setPhase = useCallback((phase: SurveyPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const setPreferredVariant = useCallback((variant: string) => {
    setState((prev) => ({ ...prev, preferredVariant: variant }));
  }, []);

  const setPreferenceReason = useCallback((reason: string) => {
    setState((prev) => ({ ...prev, preferenceReason: reason }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.currentQuestionIndex < PILOT_QUESTIONS.length - 1) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
      }
      return { ...prev, phase: "demographic" };
    });
  }, []);

  const prev = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  }, []);

  // Derived values
  const totalAnswered = Object.keys(state.answers).length;
  const progress = Math.round((totalAnswered / PILOT_QUESTIONS.length) * 100);
  const currentQuestion: PilotQuestion =
    PILOT_QUESTIONS[state.currentQuestionIndex] ?? PILOT_QUESTIONS[0];
  const currentDimension: Dimension = getDimension(currentQuestion.dimensionId);
  const currentDimIndex = DIMENSIONS.findIndex((d) => d.id === currentDimension.id);

  return {
    state,
    setState,
    setAnswer,
    setDemographic,
    setFeedback,
    goToQuestion,
    goToDimension,
    setPhase,
    setPreferredVariant,
    setPreferenceReason,
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
