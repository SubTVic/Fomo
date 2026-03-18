// SPDX-License-Identifier: AGPL-3.0-only
// Main quiz orchestrator: welcome → quiz → results
"use client";

import { useState, useCallback } from "react";
import type { QuizThesisData, QuizGroupData, QuizVariant } from "@/lib/quiz/types";
import type { Dimension, PilotQuestion } from "@/lib/pilot-questions";
import { useSurveyState } from "@/components/survey/useSurveyState";
import { computeQuizMatches } from "@/lib/quiz/matching";
import { QuizWelcome } from "./QuizWelcome";
import { QuizResults } from "./results/QuizResults";

// Variant components
import { ScrollSurvey } from "@/components/variants/scroll/ScrollSurvey";
import { ClassicSurvey } from "@/components/variants/classic/ClassicSurvey";
import { SwipeSurvey } from "@/components/variants/swipe/SwipeSurvey";
import { ChatSurvey } from "@/components/variants/chat/ChatSurvey";

const VARIANT_MAP = {
  classic: ClassicSurvey,
  scroll: ScrollSurvey,
  swipe: SwipeSurvey,
  chat: ChatSurvey,
} as const;

interface QuizRouterProps {
  theses: QuizThesisData[];
  groups: QuizGroupData[];
  variant: QuizVariant;
}

export function QuizRouter({ theses, groups, variant }: QuizRouterProps) {
  const [phase, setPhase] = useState<"welcome" | "quiz" | "results">("welcome");

  // Create synthetic dimension and questions for the variant adapter
  const syntheticDimension: Dimension = {
    id: "quiz",
    label: "Quiz",
    emoji: "🎯",
    description: "Finde passende Hochschulgruppen",
    blockIndex: 0,
  };

  const syntheticQuestions: PilotQuestion[] = theses.map((t) => ({
    id: t.id,
    dimensionId: "quiz",
    text: t.text,
  }));

  const surveyState = useSurveyState(syntheticQuestions, [syntheticDimension]);

  const handleBlockComplete = useCallback(() => {
    setPhase("results");
  }, []);

  // Noop — quiz doesn't submit to server
  const handleSubmit = useCallback(async () => {}, []);

  if (phase === "welcome") {
    return <QuizWelcome onStart={() => setPhase("quiz")} questionCount={theses.length} />;
  }

  if (phase === "results") {
    const results = computeQuizMatches(surveyState.state.answers, theses, groups);
    return (
      <QuizResults
        results={results}
        theses={theses}
        answeredCount={surveyState.totalAnswered}
        onRestart={() => {
          surveyState.setState((prev) => ({
            ...prev,
            answers: {},
            currentQuestionIndex: 0,
            phase: "questions",
          }));
          setPhase("welcome");
        }}
      />
    );
  }

  // Quiz phase — render the selected variant
  const VariantComponent = VARIANT_MAP[variant];

  return (
    <VariantComponent
      {...surveyState}
      onSubmit={handleSubmit}
      isSubmitting={false}
      blockDimensions={[syntheticDimension]}
      blockQuestions={syntheticQuestions}
      onBlockComplete={handleBlockComplete}
    />
  );
}
