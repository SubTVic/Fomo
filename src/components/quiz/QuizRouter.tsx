// SPDX-License-Identifier: AGPL-3.0-only
// Main quiz orchestrator: welcome → quiz → results
"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { QuizThesisData, QuizGroupData } from "@/lib/quiz/types";
import type { Dimension, PilotQuestion } from "@/lib/pilot-questions";
import { useSurveyState } from "@/components/survey/useSurveyState";
import { computeQuizMatches, computeV2Match } from "@/lib/quiz/matching";
import { STUDY2_ITEMS } from "@/lib/study2/items";
import { QuizWelcome } from "./QuizWelcome";
import { QuizResults } from "./results/QuizResults";
import { ClassicSurvey } from "@/components/variants/classic/ClassicSurvey";

interface QuizRouterProps {
  theses: QuizThesisData[];
  groups: QuizGroupData[];
}

export function QuizRouter({ theses, groups }: QuizRouterProps) {
  const t = useTranslations("quiz");
  const [phase, setPhase] = useState<"welcome" | "quiz" | "results">("welcome");
  const startedAt = useRef<number | null>(null);

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
    hint: t.hint ?? undefined,
  }));

  const surveyState = useSurveyState(syntheticQuestions, [syntheticDimension]);

  const handleSubmit = useCallback(async () => {
    if (!startedAt.current) return;
    const answeredCount = Object.values(surveyState.state.answers).filter(
      (v) => v === "1" || v === "5"
    ).length;
    await fetch("/api/quiz/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startedAt: startedAt.current,
        completedAt: Date.now(),
        questionCount: answeredCount,
        resultCount: 0,
      }),
    }).catch(() => {
      // Fire-and-forget — tracking failure must not block the user
    });
  }, [surveyState.state.answers]);

  const handleBlockComplete = useCallback(() => {
    setPhase("results");
    handleSubmit();
  }, [handleSubmit]);

  if (theses.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6" style={{ background: "#ADD8E6" }}>
        <div className="w-full max-w-sm border-4 border-[#1a2a35] bg-white p-8 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h2
            className="text-lg font-bold uppercase text-[#1a2a35] mb-3"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            {t("comingSoonTitle")}
          </h2>
          <p className="text-sm text-[#5a7a8a]">{t("comingSoonText")}</p>
        </div>
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <QuizWelcome
        onStart={() => {
          startedAt.current = Date.now();
          setPhase("quiz");
        }}
        questionCount={theses.length}
      />
    );
  }

  if (phase === "results") {
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
              {t("tooNeutralTitle")}
            </h2>
            <p className="text-sm text-[#5a7a8a] mb-6">
              {t("tooNeutralText", { answered: effectiveAnswerCount, total: theses.length })}
            </p>
            <p
              className="text-sm text-[#5a7a8a] mb-6"
              dangerouslySetInnerHTML={{ __html: t("tooNeutralHint") }}
            />
            <button
              onClick={() => setPhase("quiz")}
              className="w-full bg-[#1a2a35] text-[#ADD8E6] py-3 text-sm font-bold uppercase tracking-wide hover:bg-[#2a3a45] transition-colors"
            >
              {t("backToQuestions")}
            </button>
          </div>
        </div>
      );
    }

    // Build thesis → WS2 item mapping through shared attributes (first match per thesis)
    const attrToItemId: Record<string, string> = {};
    for (const item of STUDY2_ITEMS) {
      for (const a of item.attributes) {
        if (!attrToItemId[a.attribute]) attrToItemId[a.attribute] = item.id;
      }
    }
    const thesisToItemMap: Record<string, string> = {};
    for (const thesis of theses) {
      for (const a of thesis.attributes) {
        if (attrToItemId[a.attribute]) {
          thesisToItemMap[thesis.id] = attrToItemId[a.attribute];
          break;
        }
      }
    }

    const results = groups
      .map((group) => {
        if (group.selfRating?.answers?.length) {
          const score = computeV2Match(
            surveyState.state.answers,
            thesisToItemMap,
            group.selfRating.answers,
            [], // no filter step in quiz
            group.selfRating.filterSelections,
          );
          return { group, score, attributeMatches: [] };
        }
        return null; // will be replaced by legacy match below
      })
      .map((v2result, i) => {
        if (v2result !== null) return v2result;
        return computeQuizMatches(surveyState.state.answers, theses, [groups[i]])[0];
      })
      .sort((a, b) => b.score - a.score);
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

  return (
    <ClassicSurvey
      {...surveyState}
      onSubmit={handleSubmit}
      isSubmitting={false}
      blockDimensions={[syntheticDimension]}
      blockQuestions={syntheticQuestions}
      onBlockComplete={handleBlockComplete}
    />
  );
}
