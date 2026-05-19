// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { StepProps } from "./types";

export function Step01HowItWorks({ theses }: StepProps) {
  const t = useTranslations("demo.step1");
  const [demoAnswer, setDemoAnswer] = useState<"5" | "3" | "1" | null>(null);
  const exampleThesis = theses[0];

  const weight = demoAnswer
    ? Math.abs((parseInt(demoAnswer) - 1) / 4 - 0.5) * 2
    : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">{t("stepLabel")}</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          {t("title")}
        </h2>
      </div>

      {/* The 3 buttons */}
      <div className="border-4 border-[#1a2a35] bg-white p-6 space-y-4">
        <p className="text-sm font-bold text-[#1a2a35] uppercase tracking-wide">
          {exampleThesis ? `"${exampleThesis.text}"` : t("exampleLabel")}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { val: "1", label: t("disagreeLabel"), color: "bg-red-50 border-red-300 text-red-700", symbol: "✗" },
            { val: "3", label: t("neutralLabel"), color: "bg-gray-50 border-gray-300 text-gray-600", symbol: "–" },
            { val: "5", label: t("agreeLabel"), color: "bg-green-50 border-green-300 text-green-700", symbol: "✓" },
          ] as const).map(({ val, label, color, symbol }) => (
            <button
              key={val}
              onClick={() => setDemoAnswer(val)}
              className={`rounded border-2 p-3 text-center transition-all ${color} ${demoAnswer === val ? "scale-105 shadow-md ring-2 ring-offset-1 ring-[#1a2a35]" : "hover:scale-105"}`}
            >
              <div className="text-2xl font-bold">{symbol}</div>
              <div className="mt-1 text-xs font-medium">{label}</div>
            </button>
          ))}
        </div>
        {demoAnswer && (
          <div className="rounded bg-[#f0f8ff] border border-[#ADD8E6] p-3 text-sm text-[#1a2a35]">
            <strong>{t("weightLabel")}</strong>{" "}
            {demoAnswer === "3" ? (
              <span className="text-gray-500">{t("weightNeutral")}</span>
            ) : (
              <span className="text-green-700">
                {t("weightPositive", { pct: Math.round((weight ?? 0) * 100) })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Algorithm explanation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-4 border-[#1a2a35] bg-white p-4 text-center">
          <div className="text-2xl">①</div>
          <p className="mt-2 text-sm font-bold text-[#1a2a35]">{t("step1Title")}</p>
          <p className="mt-1 text-xs text-[#5a7a8a]">
            {t("step1Body").split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </p>
        </div>
        <div className="border-4 border-[#1a2a35] bg-white p-4 text-center">
          <div className="text-2xl">②</div>
          <p className="mt-2 text-sm font-bold text-[#1a2a35]">{t("step2Title")}</p>
          <p className="mt-1 text-xs text-[#5a7a8a]">
            {t("step2Body")}
          </p>
        </div>
        <div className="border-4 border-[#1a2a35] bg-white p-4 text-center">
          <div className="text-2xl">③</div>
          <p className="mt-2 text-sm font-bold text-[#1a2a35]">{t("step3Title")}</p>
          <p className="mt-1 text-xs text-[#5a7a8a]">
            {t("step3Body", { count: theses.length })}
          </p>
        </div>
      </div>

      {/* Key insight */}
      <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-5">
        <p className="text-sm font-bold text-[#ADD8E6] uppercase tracking-wide">{t("importantLabel")}</p>
        <p className="mt-2 text-white text-sm leading-relaxed">
          {t("important")}
        </p>
      </div>

      <p className="text-center text-xs text-[#1a2a35]/50">
        {t("hint")}
      </p>
    </div>
  );
}
