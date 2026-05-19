// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useTranslations, useMessages } from "next-intl";
import Link from "next/link";
import type { StepProps } from "./types";

type TimelineEntry = {
  phase: string;
  date: string;
  title: string;
  status: string;
  items: string[];
};

type FutureEntry = {
  emoji: string;
  title: string;
  desc: string;
};

export function Step09Roadmap({}: StepProps) {
  const t = useTranslations("demo.step9");
  const messages = useMessages();
  const step9Messages = (messages.demo as Record<string, unknown>).step9 as Record<string, unknown>;
  const TIMELINE = step9Messages.timeline as TimelineEntry[];
  const FUTURE = step9Messages.future as FutureEntry[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">{t("stepLabel")}</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-[#5a7a8a]">{t("subtitle")}</p>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {TIMELINE.map((entry) => (
          <div
            key={entry.phase}
            className={`border-4 p-4 ${
              entry.status === "done"
                ? "border-green-600 bg-green-50"
                : entry.status === "now"
                ? "border-[#1a2a35] bg-[#1a2a35] text-white"
                : "border-[#1a2a35]/30 bg-white opacity-80"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {entry.status === "done" && (
                  <span className="rounded-full bg-green-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                    {t("done")}
                  </span>
                )}
                {entry.status === "now" && (
                  <span className="rounded-full bg-[#ADD8E6] px-2 py-0.5 text-[9px] font-bold text-[#1a2a35] uppercase">
                    {t("now")}
                  </span>
                )}
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    entry.status === "done" ? "text-green-700" : entry.status === "now" ? "text-[#ADD8E6]" : "text-[#5a7a8a]"
                  }`}
                >
                  {entry.phase} · {entry.date}
                </span>
              </div>
            </div>
            <p className={`font-bold text-sm ${entry.status === "now" ? "text-white" : "text-[#1a2a35]"}`}>
              {entry.title}
            </p>
            <ul className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs ${entry.status === "now" ? "text-[#ADD8E6]/80" : entry.status === "done" ? "text-green-700/70" : "text-[#5a7a8a]"}`}>
              {entry.items.map((item) => (
                <li key={item}>{entry.status === "done" ? "✓" : "·"} {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Future features */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#1a2a35] mb-2">{t("futureTitle")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FUTURE.map((f) => (
            <div key={f.title} className="border-2 border-dashed border-[#1a2a35]/20 bg-white p-2.5 text-center">
              <p className="text-xl">{f.emoji}</p>
              <p className="text-xs font-bold text-[#1a2a35]">{f.title}</p>
              <p className="text-[10px] text-[#7a9aaa]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-5 text-center space-y-3">
        <p className="text-white font-bold">{t("ctaTitle")}</p>
        <p className="text-[#ADD8E6]/70 text-sm">
          {t("ctaText")}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/quiz"
            className="rounded border-2 border-[#ADD8E6] px-4 py-2 text-sm font-bold text-[#ADD8E6] hover:bg-[#ADD8E6]/10 transition-colors"
          >
            {t("ctaQuiz")}
          </Link>
          <a
            href="https://github.com/SubTVic/Fomo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border-2 border-[#ADD8E6]/40 px-4 py-2 text-sm text-[#ADD8E6]/70 hover:border-[#ADD8E6] transition-colors"
          >
            {t("ctaGithub")}
          </a>
        </div>
      </div>
    </div>
  );
}
