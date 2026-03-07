// SPDX-License-Identifier: AGPL-3.0-only
// Swipe variant: Tinder-style, one card per question, swipe or tap to answer
// In multi-variant mode, only shows the assigned blockQuestions

"use client";

import { useRef, useState, useCallback } from "react";
import { getDimension } from "@/lib/pilot-questions";
import type { SurveyVariantProps } from "@/components/variants/types";

const SWIPE_OPTIONS = [
  { value: "1", label: "Nein", emoji: "👎" },
  { value: "3", label: "Egal", emoji: "😐" },
  { value: "5", label: "Ja", emoji: "👍" },
];

export function SwipeSurvey({
  state,
  setAnswer,
  blockQuestions,
  onBlockComplete,
}: SurveyVariantProps) {
  const { answers } = state;
  const [localIdx, setLocalIdx] = useState(0);

  const question = blockQuestions[localIdx] ?? blockQuestions[0];
  const currentValue = answers[question.id] as string | undefined;
  const dimension = getDimension(question.dimensionId);

  // Drag/swipe state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);

  const isFirst = localIdx === 0;
  const isLast = localIdx === blockQuestions.length - 1;

  const blockAnswered = blockQuestions.filter((q) => answers[q.id] !== undefined).length;
  const blockProgress = Math.round((blockAnswered / blockQuestions.length) * 100);

  const advance = useCallback(() => {
    if (isLast) onBlockComplete();
    else setLocalIdx((i) => i + 1);
  }, [isLast, onBlockComplete]);

  function handleAnswer(value: string) {
    if (exitDir) return;
    setAnswer(question.id, value);
    const dir = value === "5" ? "right" : value === "1" ? "left" : null;
    if (dir) setExitDir(dir);
    setTimeout(() => {
      setExitDir(null);
      setDragX(0);
      advance();
    }, 350);
  }

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    setDragX(e.clientX - startX.current);
  }
  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragX) > 100) {
      handleAnswer(dragX > 0 ? "5" : "1");
    } else {
      setDragX(0);
    }
  }

  const cardRotation = dragX / 20;
  const swipeOpacityRight = Math.max(0, Math.min(1, dragX / 120));
  const swipeOpacityLeft = Math.max(0, Math.min(1, -dragX / 120));

  const exitTransform =
    exitDir === "right"
      ? "translateX(120%) rotate(20deg)"
      : exitDir === "left"
        ? "translateX(-120%) rotate(-20deg)"
        : `translateX(${dragX}px) rotate(${cardRotation}deg)`;

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col text-white select-none">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div>
          <span className="font-heading uppercase border-2 border-white px-2 py-0.5">FOMO</span>
          <span className="text-white/50 text-sm ml-3">
            {dimension.emoji} {dimension.label}
          </span>
        </div>
        <span className="text-sm text-white/60 tabular-nums">
          {localIdx + 1} / {blockQuestions.length}
        </span>
      </header>

      {/* Progress */}
      <div className="h-0.5 bg-white/10 flex-shrink-0">
        <div
          className="h-full bg-[#ADD8E6] transition-all duration-300"
          style={{ width: `${blockProgress}%` }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Swipe hints */}
        <div className="flex items-center justify-between w-full max-w-sm">
          <span
            className="text-red-400 font-bold text-sm transition-opacity duration-150"
            style={{ opacity: swipeOpacityLeft }}
          >
            ← NEIN
          </span>
          <span
            className="text-green-400 font-bold text-sm transition-opacity duration-150"
            style={{ opacity: swipeOpacityRight }}
          >
            JA →
          </span>
        </div>

        {/* Question card */}
        <div
          className="w-full max-w-sm bg-white text-gray-900 rounded-2xl p-7 shadow-2xl cursor-grab active:cursor-grabbing touch-none"
          style={{
            transform: exitTransform,
            transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <p className="text-base font-semibold leading-relaxed">{question.text}</p>
          {currentValue && (
            <div className="mt-4 text-sm text-muted-foreground">
              Deine Antwort: <strong>{currentValue === "0" ? "Frage nicht verstanden" : (SWIPE_OPTIONS.find(o => o.value === currentValue)?.label ?? currentValue)}</strong>
            </div>
          )}
        </div>

        {/* Answer buttons */}
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <div className="flex gap-3">
            {SWIPE_OPTIONS.map(({ value, label, emoji }) => {
              const isSelected = currentValue === value;
              return (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  aria-label={label}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl border py-4 text-sm font-bold transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? "bg-[#ADD8E6] border-[#ADD8E6] text-white scale-105"
                      : "bg-white/10 border-white/20 hover:bg-white/20"
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-xs">{label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => handleAnswer("0")}
            className={`w-full rounded-xl border border-dashed px-3 py-2.5 text-left transition-all duration-150 active:scale-95 ${
              currentValue === "0"
                ? "border-yellow-500 bg-yellow-500/20 text-yellow-200"
                : "border-white/15 text-white/40 hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-medium">Ich hab die Frage nicht verstanden</span>
            <span className="block text-[11px] text-white/30 mt-0.5">
              Hilft uns, unklare Fragen zu verbessern
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 px-6 pb-6 flex items-center justify-between">
        <button
          onClick={() => setLocalIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="text-sm text-white/50 hover:text-white/80 disabled:invisible"
        >
          ← Zurück
        </button>
        <button
          onClick={advance}
          className="text-sm text-white/50 hover:text-white/80"
        >
          Überspringen →
        </button>
      </div>
    </div>
  );
}
