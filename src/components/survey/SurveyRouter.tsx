// SPDX-License-Identifier: AGPL-3.0-only
// Orchestrates the multi-variant pilot survey flow:
// 4 blocks of questions, each with a different UI variant (randomized order)
// After all blocks: demographic -> feedback -> preference -> submit -> done

"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSurveyState } from "./useSurveyState";
import { ScrollSurvey } from "@/components/variants/scroll/ScrollSurvey";
import { ClassicSurvey } from "@/components/variants/classic/ClassicSurvey";
import { SwipeSurvey } from "@/components/variants/swipe/SwipeSurvey";
import { ChatSurvey } from "@/components/variants/chat/ChatSurvey";
import { VariantTransition } from "./VariantTransition";
import { PreferenceQuestion } from "./PreferenceQuestion";
import { DevSwitcher } from "./DevSwitcher";
import { generateBlocks, getVariantOrder } from "@/lib/pilot-variant-order";
import type { Block, VariantKey } from "@/lib/pilot-variant-order";
import { DIMENSIONS, getQuestionsForDimension } from "@/lib/pilot-questions";
import type { Dimension, PilotQuestion } from "@/lib/pilot-questions";

const VARIANT_COMPONENTS: Record<VariantKey, typeof ScrollSurvey> = {
  scroll: ScrollSurvey,
  classic: ClassicSurvey,
  swipe: SwipeSurvey,
  chat: ChatSurvey,
};

type RouterPhase = "transition" | "block" | "demographic" | "feedback" | "preference" | "done";

export function SurveyRouter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [routerPhase, setRouterPhase] = useState<RouterPhase>("transition");

  const surveyState = useSurveyState();

  // Generate blocks on client only to avoid hydration mismatch (Math.random)
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  useEffect(() => { setBlocks(generateBlocks()); }, []);

  const variantOrder = useMemo(() => blocks ? getVariantOrder(blocks) : [], [blocks]);

  const currentBlock = blocks ? blocks[currentBlockIdx] : null;

  // Resolve dimensions and questions for the current block
  const blockDimensions: Dimension[] = useMemo(
    () => currentBlock ? currentBlock.dimensionIds.map((id) => DIMENSIONS.find((d) => d.id === id)!) : [],
    [currentBlock],
  );
  const blockQuestions: PilotQuestion[] = useMemo(
    () => currentBlock ? currentBlock.dimensionIds.flatMap((id) => getQuestionsForDimension(id)) : [],
    [currentBlock],
  );

  const onBlockComplete = useCallback(() => {
    if (!blocks) return;
    if (currentBlockIdx < blocks.length - 1) {
      setCurrentBlockIdx((i) => i + 1);
      setRouterPhase("transition");
    } else {
      setRouterPhase("demographic");
    }
  }, [currentBlockIdx, blocks]);

  const onSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pilot/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantOrder,
          answers: surveyState.state.answers,
          demographic: surveyState.state.demographic,
          feedback: surveyState.state.feedback,
          preferredVariant: surveyState.state.preferredVariant,
          preferenceReason: surveyState.state.preferenceReason,
          durationMs: Date.now() - surveyState.state.startTime,
        }),
      });
      if (res.ok) {
        setRouterPhase("done");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [variantOrder, surveyState]);

  // ── Loading (blocks not yet generated on client) ─────
  if (!blocks || !currentBlock) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground">Laden...</span>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────
  if (routerPhase === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background">
        <div className="text-5xl">&#127881;</div>
        <h1 className="text-2xl font-bold">Danke für deine Teilnahme!</h1>
        <p className="text-muted-foreground max-w-sm">
          Deine Antworten wurden gespeichert. Du hilfst uns damit, FOMO noch besser zu machen.
        </p>
        <Link href="/" className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium">
          Zur Startseite
        </Link>
      </div>
    );
  }

  // ── Preference question ───────────────────────────────
  if (routerPhase === "preference") {
    return (
      <PreferenceQuestion
        selected={surveyState.state.preferredVariant}
        reason={surveyState.state.preferenceReason}
        onSelect={surveyState.setPreferredVariant}
        onReasonChange={surveyState.setPreferenceReason}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  // ── Feedback ──────────────────────────────────────────
  if (routerPhase === "feedback") {
    const { feedback } = surveyState.state;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
          <div className="mx-auto max-w-xl flex items-center justify-between">
            <span className="font-bold text-lg">FOMO Pilot</span>
            <span className="text-sm text-muted-foreground">Abschlussfeedback</span>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-xl px-4 py-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold">Kurzes Feedback</h2>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-medium text-sm">Was war verwirrend oder unklar?</span>
              <textarea
                rows={3}
                value={feedback.confusing}
                onChange={(e) => surveyState.setFeedback("confusing", e.target.value)}
                placeholder="Optional..."
                className="rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-medium text-sm">Was hat gefehlt oder sollte anders sein?</span>
              <textarea
                rows={3}
                value={feedback.missing}
                onChange={(e) => surveyState.setFeedback("missing", e.target.value)}
                placeholder="Optional..."
                className="rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          <button
            onClick={() => setRouterPhase("preference")}
            className="w-full rounded-xl bg-primary py-4 text-primary-foreground font-semibold text-lg"
          >
            Weiter
          </button>
        </main>
      </div>
    );
  }

  // ── Demographic ───────────────────────────────────────
  if (routerPhase === "demographic") {
    const { demographic } = surveyState.state;
    const demoDone = demographic.semester !== null && demographic.isMember !== null;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
          <div className="mx-auto max-w-xl flex items-center justify-between">
            <span className="font-bold text-lg">FOMO Pilot</span>
            <span className="text-sm text-muted-foreground">Noch 2 kurze Fragen</span>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-xl px-4 py-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold">Kurz über dich</h2>

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">In welchem Semester bist du?</span>
            <div className="flex flex-wrap gap-2">
              {["1", "2", "3", "4", "5", "6+"].map((s) => (
                <button
                  key={s}
                  onClick={() => surveyState.setDemographic("semester", s)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    demographic.semester === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-muted/40"
                  }`}
                >
                  {s}. Semester
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">Bist du bereits in einer Hochschulgruppe?</span>
            <div className="flex flex-col gap-2">
              {[
                { value: "no", label: "Nein, noch nicht" },
                { value: "yes", label: "Ja, aktuell" },
                { value: "was", label: "War ich, bin es nicht mehr" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => surveyState.setDemographic("isMember", value)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${
                    demographic.isMember === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-muted/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {demographic.isMember && demographic.isMember !== "no" && (
            <label className="flex flex-col gap-1.5">
              <span className="font-medium text-sm">In welcher Gruppe (optional)?</span>
              <input
                type="text"
                value={demographic.groupNames ?? ""}
                onChange={(e) => surveyState.setDemographic("groupNames", e.target.value)}
                placeholder="z.B. AEGEE, ESN, ..."
                className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          )}

          <button
            onClick={() => setRouterPhase("feedback")}
            disabled={!demoDone}
            className="w-full rounded-xl bg-primary py-4 text-primary-foreground font-semibold text-lg disabled:opacity-50"
          >
            Weiter
          </button>
        </main>
      </div>
    );
  }

  // ── Transition screen (shown before each block) ──────
  if (routerPhase === "transition") {
    return (
      <>
        <VariantTransition
          variant={currentBlock.variant}
          blockIndex={currentBlockIdx}
          totalBlocks={blocks.length}
          onContinue={() => setRouterPhase("block")}
        />
        <DevSwitcher blocks={blocks} currentBlockIdx={currentBlockIdx} />
      </>
    );
  }

  // ── Active block (render the variant component) ──────
  const VariantComponent = VARIANT_COMPONENTS[currentBlock.variant];

  return (
    <>
      <VariantComponent
        {...surveyState}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        blockDimensions={blockDimensions}
        blockQuestions={blockQuestions}
        onBlockComplete={onBlockComplete}
      />
      <DevSwitcher blocks={blocks} currentBlockIdx={currentBlockIdx} />
    </>
  );
}
