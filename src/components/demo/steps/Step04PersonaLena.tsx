// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useTranslations } from "next-intl";
import type { StepProps } from "./types";
import { PERSONAS } from "../personas";
import { DemoPersonaAnswers } from "../DemoPersonaAnswers";

export function Step04PersonaLena({ theses }: StepProps) {
  const t = useTranslations("demo.step4");
  const persona = PERSONAS[1];
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">{t("stepLabel")}</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          {t("title", { emoji: persona.emoji, name: persona.name })}
        </h2>
        <p className="mt-1 text-sm text-[#5a7a8a]">{persona.study}</p>
      </div>

      <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-4 text-white text-sm leading-relaxed">
        {persona.description}
      </div>

      <div className="border-4 border-[#1a2a35] bg-white p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1a2a35]">
          {t("answersLabel", { name: persona.name, count: theses.length })}
        </p>
        <DemoPersonaAnswers persona={persona} theses={theses} />
      </div>

      <p className="text-center text-xs text-[#1a2a35]/50">
        {t("hint", { name: persona.name })}
      </p>
    </div>
  );
}
