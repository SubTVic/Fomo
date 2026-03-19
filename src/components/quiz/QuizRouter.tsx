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

  if (theses.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6" style={{ background: "#ADD8E6" }}>
        <div className="w-full max-w-sm border-4 border-[#1a2a35] bg-white p-8 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h2
            className="text-lg font-bold uppercase text-[#1a2a35] mb-3"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Quiz coming soon
          </h2>
          <p className="text-sm text-[#5a7a8a]">
            Das Quiz wird gerade vorbereitet. Schau bald wieder vorbei!
          </p>
        </div>
      </div>
    );
  }

  if (phase === "welcome") {
    return <QuizWelcome onStart={() => setPhase("quiz")} questionCount={theses.length} />;
  }

  if (phase === "results") {
    // Count non-neutral answers (value "1" or "5" → weight > 0)
    const effectiveAnswerCount = Object.values(surveyState.state.answers).filter(
      (v) => v === "1" || v === "5",
    ).length;

    if (effectiveAnswerCount < 5) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: "#ADD8E6" }}>
          <div className="max-w-sm w-full border-4 border-[#1a2a35] bg-white p-8 text-center">
            <div className="text-4xl mb-4">🤔</div>
            <h2
              className="text-lg font-bold uppercase text-[#1a2a35] mb-3"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Zu viele neutrale Antworten
            </h2>
            <p className="text-sm text-[#5a7a8a] mb-6">
              Du hast nur {effectiveAnswerCount} von {theses.length} Fragen klar beantwortet.
              Das reicht nicht für ein sinnvolles Matching — alle Gruppen würden gleich gut passen.
            </p>
            <p className="text-sm text-[#5a7a8a] mb-6">
              Bitte geh zurück und beantworte mindestens 5 Fragen mit <strong>Ja</strong> oder <strong>Nein</strong>.
            </p>
            <button
              onClick={() => setPhase("quiz")}
              className="w-full bg-[#1a2a35] text-[#ADD8E6] py-3 text-sm font-bold uppercase tracking-wide hover:bg-[#2a3a45] transition-colors"
            >
              Zurück zu den Fragen
            </button>
          </div>
        </div>
      );
    }

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
