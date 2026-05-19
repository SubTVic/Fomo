// SPDX-License-Identifier: AGPL-3.0-only
// Welcome screen for the live quiz
"use client";

import { useTranslations } from "next-intl";

interface QuizWelcomeProps {
  onStart: () => void;
  questionCount: number;
}

export function QuizWelcome({ onStart, questionCount }: QuizWelcomeProps) {
  const t = useTranslations("quiz.welcome");

  // Labels use "Keyword — description" format; split on the separator
  const splitLabel = (key: string) => {
    const parts = t(key).split(" — ");
    return { keyword: parts[0], desc: parts[1] ?? "" };
  };
  const agree = splitLabel("agreeLabel");
  const neutral = splitLabel("neutralLabel");
  const disagree = splitLabel("disagreeLabel");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8"
      style={{ background: "#ADD8E6" }}
    >
      <div className="w-full max-w-[440px] border-4 border-[#1a2a35] bg-white">
        <div className="bg-[#1a2a35] px-6 py-5 text-center">
          <h1
            className="text-2xl uppercase tracking-wide text-[#ADD8E6]"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            FOMO Quiz
          </h1>
          <p className="mt-1 text-sm text-[#ADD8E6]/70">{t("subtitle")}</p>
        </div>

        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-[#5a7a8a] leading-relaxed">
            {t("intro", { count: questionCount })}
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded border-2 border-[#1a2a35]/10 px-3 py-2.5">
              <span className="text-lg">✓</span>
              <span className="text-sm text-[#1a2a35]">
                <strong className="text-green-600">{agree.keyword}</strong>
                {agree.desc && ` — ${agree.desc}`}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded border-2 border-[#1a2a35]/10 px-3 py-2.5">
              <span className="text-lg">─</span>
              <span className="text-sm text-[#1a2a35]">
                <strong className="text-gray-500">{neutral.keyword}</strong>
                {neutral.desc && ` — ${neutral.desc}`}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded border-2 border-[#1a2a35]/10 px-3 py-2.5">
              <span className="text-lg">✗</span>
              <span className="text-sm text-[#1a2a35]">
                <strong className="text-red-500">{disagree.keyword}</strong>
                {disagree.desc && ` — ${disagree.desc}`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[#7a9aaa]">
            <span>{t("meta1")}</span>
            <span>·</span>
            <span>{t("meta2")}</span>
            <span>·</span>
            <span>{t("meta3")}</span>
          </div>

          <button
            onClick={onStart}
            className="w-full rounded border-4 border-[#1a2a35] bg-[#1a2a35] py-3.5 text-sm font-bold uppercase tracking-wider text-[#ADD8E6] transition-colors hover:bg-[#2a3a45]"
          >
            {t("startButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
