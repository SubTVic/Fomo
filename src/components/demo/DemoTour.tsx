// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { QuizThesisData, QuizGroupData } from "@/lib/quiz/types";
import { Step00Intro } from "./steps/Step00Intro";
import { Step01HowItWorks } from "./steps/Step01HowItWorks";
import { Step02PersonaMax } from "./steps/Step02PersonaMax";
import { Step03ResultMax } from "./steps/Step03ResultMax";
import { Step04PersonaLena } from "./steps/Step04PersonaLena";
import { Step05ResultLena } from "./steps/Step05ResultLena";
import { Step06Compare } from "./steps/Step06Compare";
import { Step07Layouts } from "./steps/Step07Layouts";
import { Step08Admin } from "./steps/Step08Admin";
import { Step09Roadmap } from "./steps/Step09Roadmap";

interface DemoTourProps {
  theses: QuizThesisData[];
  groups: QuizGroupData[];
}

export function DemoTour({ theses, groups }: DemoTourProps) {
  const t = useTranslations("demo");
  const STEP_LABELS = t.raw("stepLabels") as string[];
  const [step, setStep] = useState(0);
  const totalSteps = STEP_LABELS.length;

  const next = useCallback(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), [totalSteps]);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const stepProps = { theses, groups, onNext: next, onPrev: prev, step, totalSteps };

  return (
    <div className="relative min-h-[100dvh] flex flex-col" style={{ background: "#ADD8E6" }}>
      {/* Step content */}
      <div className="flex-1">
        {step === 0 && <Step00Intro {...stepProps} />}
        {step === 1 && <Step01HowItWorks {...stepProps} />}
        {step === 2 && <Step02PersonaMax {...stepProps} />}
        {step === 3 && <Step03ResultMax {...stepProps} />}
        {step === 4 && <Step04PersonaLena {...stepProps} />}
        {step === 5 && <Step05ResultLena {...stepProps} />}
        {step === 6 && <Step06Compare {...stepProps} />}
        {step === 7 && <Step07Layouts {...stepProps} />}
        {step === 8 && <Step08Admin {...stepProps} />}
        {step === 9 && <Step09Roadmap {...stepProps} />}
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 z-50 border-t-4 border-[#1a2a35] bg-[#1a2a35] px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded border-2 border-[#ADD8E6]/30 px-4 py-2 text-sm font-medium text-[#ADD8E6] transition-colors hover:border-[#ADD8E6] disabled:opacity-30"
          >
            {t("nav.back")}
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                title={label}
                className={`rounded-full transition-all ${
                  i === step
                    ? "w-6 h-2.5 bg-[#ADD8E6]"
                    : i < step
                    ? "w-2.5 h-2.5 bg-[#ADD8E6]/50"
                    : "w-2.5 h-2.5 bg-[#ADD8E6]/20"
                }`}
              />
            ))}
          </div>

          {step < totalSteps - 1 ? (
            <button
              onClick={next}
              className="rounded border-2 border-[#ADD8E6] bg-[#ADD8E6] px-4 py-2 text-sm font-bold text-[#1a2a35] transition-colors hover:bg-white"
            >
              {t("nav.next")}
            </button>
          ) : (
            <button
              onClick={() => setStep(0)}
              className="rounded border-2 border-[#ADD8E6] px-4 py-2 text-sm font-bold text-[#ADD8E6] transition-colors hover:bg-[#ADD8E6]/10"
            >
              ↺ Neustart
            </button>
          )}
        </div>

        {/* Step label */}
        <p className="mt-1.5 text-center text-xs text-[#ADD8E6]/50">
          {step + 1} / {totalSteps} — {STEP_LABELS[step]}
        </p>
      </div>
    </div>
  );
}
