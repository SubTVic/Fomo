// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useTranslations } from "next-intl";
import type { StepProps } from "./types";

export function Step00Intro({ groups, onNext }: StepProps) {
  const t = useTranslations("demo.step0");
  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-block border-4 border-[#1a2a35] bg-white px-6 py-3">
            <span
              className="text-4xl uppercase tracking-widest text-[#1a2a35]"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              FOMO
            </span>
          </div>
          <p className="mt-3 text-sm font-medium uppercase tracking-widest text-[#1a2a35]/60">
            {t("subtitle")}
          </p>
        </div>

        {/* Problem statement */}
        <div className="border-4 border-[#1a2a35] bg-white p-6 text-center">
          <p className="text-5xl font-black text-[#1a2a35]">{t("stat1Value")}</p>
          <p className="mt-1 text-lg text-[#5a7a8a]">{t("stat1Label")}</p>
          <div className="my-4 border-t-2 border-dashed border-[#1a2a35]/10" />
          <p className="text-4xl font-black text-[#1a2a35]">{t("stat2Value")}</p>
          <p className="mt-1 text-lg text-[#5a7a8a]">{t("stat2Label")}</p>
          <div className="my-4 border-t-2 border-dashed border-[#1a2a35]/10" />
          <p className="text-2xl font-black text-red-500">{t("stat3Value")}</p>
          <p className="mt-1 text-lg text-[#5a7a8a]">{t("stat3Label")}</p>
        </div>

        {/* Solution */}
        <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#ADD8E6]/70">{t("solutionLabel")}</p>
          <p className="mt-2 text-xl font-bold text-white leading-relaxed">
            {t("solution")}
          </p>
        </div>

        {/* Scalability */}
        <div className="border-4 border-[#1a2a35] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1a2a35] mb-3">{t("scaleTitle")}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded bg-[#f0f8ff] p-2">
              <p className="font-black text-[#1a2a35]">{t("scale1")}</p>
              <p className="text-[#5a7a8a]">
                {t("scale1Label").split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
            </div>
            <div className="rounded bg-[#f0f8ff] p-2">
              <p className="font-black text-[#1a2a35]">{t("scale2")}</p>
              <p className="text-[#5a7a8a]">
                {t("scale2Label").split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
            </div>
            <div className="rounded bg-[#f0f8ff] p-2">
              <p className="font-black text-[#1a2a35]">{t("scale3")}</p>
              <p className="text-[#5a7a8a]">
                {t("scale3Label").split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#5a7a8a] text-center">
            {t("openSource")}
          </p>
        </div>

        {/* Sponsors */}
        <div className="flex items-center justify-center gap-6 text-xs text-[#1a2a35]/50">
          <span>{t("sponsor")}</span>
          <span className="font-bold text-[#1a2a35]">{t("org")}</span>
          <span>·</span>
          <span>Open Source (AGPL-3.0)</span>
          <span>·</span>
          <span>{t("launch")}</span>
        </div>

        <div className="text-center">
          <button
            onClick={onNext}
            className="rounded border-4 border-[#1a2a35] bg-[#1a2a35] px-8 py-4 text-sm font-bold uppercase tracking-widest text-[#ADD8E6] transition-colors hover:bg-[#2a3a45]"
          >
            {t("startButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
