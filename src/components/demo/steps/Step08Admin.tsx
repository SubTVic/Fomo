// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { StepProps } from "./types";

export function Step08Admin({ groups, theses }: StepProps) {
  const t = useTranslations("demo.step8");
  const [idx, setIdx] = useState(0);

  const SCREENSHOTS = [
    { src: "/demo-screenshots/admin-groups.png", label: t("screenshots.groups") },
    { src: "/demo-screenshots/admin-quiz.png",   label: t("screenshots.quiz") },
    { src: "/demo-screenshots/admin-pilot.png",  label: t("screenshots.pilot") },
  ];

  const features = [
    { icon: "🏛️", title: t("features.manageGroups"), desc: t("features.manageGroupsDesc", { count: groups.length }) },
    { icon: "❓", title: t("features.quizTheses"), desc: t("features.quizThesesDesc", { count: theses.length }) },
    { icon: "🎨", title: t("features.layout"), desc: t("features.layoutDesc") },
    { icon: "📊", title: t("features.stats"), desc: t("features.statsDesc") },
    { icon: "✉️", title: t("features.invites"), desc: t("features.invitesDesc") },
    { icon: "✅", title: t("features.verify"), desc: t("features.verifyDesc") },
  ];

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
        <p className="mt-2 text-sm text-[#5a7a8a]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {features.map((f) => (
          <div key={f.title} className="border-2 border-[#1a2a35]/20 bg-white p-3 space-y-1">
            <p className="text-lg">{f.icon}</p>
            <p className="text-sm font-bold text-[#1a2a35]">{f.title}</p>
            <p className="text-xs text-[#5a7a8a]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Screenshot gallery */}
      <div className="border-4 border-[#1a2a35] overflow-hidden">
        <div className="bg-[#1a2a35] px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-[#ADD8E6]">
            {SCREENSHOTS[idx].label}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#ADD8E6]/50">{idx + 1} / {SCREENSHOTS.length}</span>
            <button
              onClick={() => setIdx((i) => (i - 1 + SCREENSHOTS.length) % SCREENSHOTS.length)}
              className="text-[#ADD8E6] hover:text-white transition-colors px-1"
              aria-label={t("prev")}
            >
              ←
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % SCREENSHOTS.length)}
              className="text-[#ADD8E6] hover:text-white transition-colors px-1"
              aria-label={t("nextLabel")}
            >
              →
            </button>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={idx}
          src={SCREENSHOTS[idx].src}
          alt={SCREENSHOTS[idx].label}
          className="w-full"
        />
      </div>

      <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-4 text-sm text-white">
        <strong className="text-[#ADD8E6]">{t("techLabel")}</strong>{" "}
        {t("tech")}
      </div>
    </div>
  );
}
