// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { StepProps } from "./types";

export function Step07Layouts({}: StepProps) {
  const t = useTranslations("demo.step7");
  const LAYOUTS = (["classic", "swipe", "scroll", "chat"] as const).map((id) => ({
    id,
    name: t(`layouts.${id}.name`),
    emoji: t(`layouts.${id}.emoji`),
    desc: t(`layouts.${id}.desc`),
  }));

  const [active, setActive] = useState("classic");
  const layout = LAYOUTS.find((l) => l.id === active)!;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">{t("stepLabel")}</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-[#5a7a8a] max-w-md mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Layout switcher */}
      <div className="flex gap-2 justify-center flex-wrap">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(l.id)}
            className={`rounded border-2 px-4 py-2 text-sm font-medium transition-all ${
              active === l.id
                ? "border-[#1a2a35] bg-[#1a2a35] text-[#ADD8E6]"
                : "border-[#1a2a35]/30 hover:border-[#1a2a35] bg-white"
            }`}
          >
            {l.emoji} {l.name}
          </button>
        ))}
      </div>

      {/* Screenshot + description */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border-4 border-[#1a2a35] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/demo-screenshots/pilot-${layout.id}.png`}
            alt={layout.name}
            className="w-full object-cover object-top max-h-[420px]"
          />
        </div>
        <div className="border-4 border-[#1a2a35] bg-white p-5 space-y-3">
          <h3 className="font-bold text-lg text-[#1a2a35]">{layout.emoji} {layout.name}</h3>
          <p className="text-sm text-[#5a7a8a] leading-relaxed">{layout.desc}</p>
        </div>
      </div>

      {/* Study explanation */}
      <div className="border-4 border-[#1a2a35] bg-white p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#1a2a35]">{t("measuresTitle")}</p>
        <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">{t("measure1Title")}</p>
            <p className="text-[#5a7a8a]">{t("measure1Desc")}</p>
          </div>
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">{t("measure2Title")}</p>
            <p className="text-[#5a7a8a]">{t("measure2Desc")}</p>
          </div>
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">{t("measure3Title")}</p>
            <p className="text-[#5a7a8a]">{t("measure3Desc")}</p>
          </div>
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">{t("measure4Title")}</p>
            <p className="text-[#5a7a8a]">{t("measure4Desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
