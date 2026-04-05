// SPDX-License-Identifier: AGPL-3.0-only
// Main quiz orchestrator: welcome → quiz → results
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { QuizThesisData, QuizGroupData, QuizVariant } from "@/lib/quiz/types";
import type { SurveyDimension, SurveyQuestion } from "@/components/variants/types";
import { useSurveyState } from "@/components/survey/useSurveyState";
import { computeQuizMatches } from "@/lib/quiz/matching";
import { QuizWelcome } from "./QuizWelcome";
import { QuizResults } from "./results/QuizResults";

// Lazy-load variant components — only the selected variant is loaded
const VARIANT_MAP = {
  classic: dynamic(() => import("@/components/variants/classic/ClassicSurvey").then((m) => m.ClassicSurvey), { ssr: false }),
  scroll: dynamic(() => import("@/components/variants/scroll/ScrollSurvey").then((m) => m.ScrollSurvey), { ssr: false }),
  swipe: dynamic(() => import("@/components/variants/swipe/SwipeSurvey").then((m) => m.SwipeSurvey), { ssr: false }),
  chat: dynamic(() => import("@/components/variants/chat/ChatSurvey").then((m) => m.ChatSurvey), { ssr: false }),
};

interface QuizRouterProps {
  theses: QuizThesisData[];
  groups: QuizGroupData[];
  variant: QuizVariant;
}

function detectDeviceType(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function QuizRouter({ theses, groups, variant }: QuizRouterProps) {
  const [phase, setPhase] = useState<"welcome" | "quiz" | "results">("welcome");
  const sessionTracked = useRef(false);

  // Create synthetic dimension and questions for the variant adapter
  const syntheticDimension: SurveyDimension = {
    id: "quiz",
    label: "Quiz",
    emoji: "🎯",
    description: "Finde passende Hochschulgruppen",
  };

  const syntheticQuestions: SurveyQuestion[] = theses.map((t) => ({
    id: t.id,
    dimensionId: "quiz",
    text: t.text,
    hint: t.hint ?? undefined,
  }));

  const surveyState = useSurveyState(syntheticQuestions, [syntheticDimension]);

  // Track abandonment when user leaves during quiz
  useEffect(() => {
    if (phase !== "quiz") return;
    const handleUnload = () => {
      if (sessionTracked.current) return;
      const answeredCount = Object.keys(surveyState.state.answers).length;
      if (answeredCount === 0) return;
      // Use sendBeacon for reliability during page unload
      navigator.sendBeacon(
        "/api/quiz/session",
        new Blob(
          [JSON.stringify({
            questionCount: answeredCount,
            resultCount: 0,
            deviceType: detectDeviceType(),
            abortedAtQ: answeredCount,
          })],
          { type: "application/json" },
        ),
      );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [phase, surveyState.state.answers]);

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

    // Track session anonymously (fire once)
    if (!sessionTracked.current) {
      sessionTracked.current = true;
      const topMatches = results.slice(0, 5).map((r) => ({
        groupId: r.group.id,
        score: r.score,
      }));
      fetch("/api/quiz/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: surveyState.state.answers,
          topMatches,
          questionCount: surveyState.totalAnswered,
          resultCount: results.length,
          deviceType: detectDeviceType(),
        }),
      }).catch((err) => console.error("[quiz-analytics]", err));
    }

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
