// SPDX-License-Identifier: AGPL-3.0-only
// Welcome screen for the live quiz
"use client";

interface QuizWelcomeProps {
  onStart: () => void;
  questionCount: number;
}

export function QuizWelcome({ onStart, questionCount }: QuizWelcomeProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8"
      style={{ background: "#ADD8E6" }}
    >
      <div className="w-full max-w-[440px] border-4 border-[#1a2a35] bg-white">
        {/* Header */}
        <div className="bg-[#1a2a35] px-6 py-5 text-center">
          <h1
            className="text-2xl uppercase tracking-wide text-[#ADD8E6]"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            FOMO Quiz
          </h1>
          <p className="mt-1 text-sm text-[#ADD8E6]/70">
            Finde deine Hochschulgruppen
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-[#5a7a8a] leading-relaxed">
            Beantworte {questionCount} kurze Thesen und finde heraus, welche
            Hochschulgruppen an der TU Dresden am besten zu dir passen.
          </p>

          {/* How it works */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded border-2 border-[#1a2a35]/10 px-3 py-2.5">
              <span className="text-lg">✓</span>
              <span className="text-sm text-[#1a2a35]"><strong className="text-green-600">Stimme zu</strong> — du findest das gut</span>
            </div>
            <div className="flex items-center gap-3 rounded border-2 border-[#1a2a35]/10 px-3 py-2.5">
              <span className="text-lg">─</span>
              <span className="text-sm text-[#1a2a35]"><strong className="text-gray-500">Neutral</strong> — ist dir egal</span>
            </div>
            <div className="flex items-center gap-3 rounded border-2 border-[#1a2a35]/10 px-3 py-2.5">
              <span className="text-lg">✗</span>
              <span className="text-sm text-[#1a2a35]"><strong className="text-red-500">Stimme nicht zu</strong> — eher nicht</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[#7a9aaa]">
            <span>~ 3 Min</span>
            <span>·</span>
            <span>Anonym</span>
            <span>·</span>
            <span>Keine Daten gespeichert</span>
          </div>

          <button
            onClick={onStart}
            className="w-full rounded border-4 border-[#1a2a35] bg-[#1a2a35] py-3.5 text-sm font-bold uppercase tracking-wider text-[#ADD8E6] transition-colors hover:bg-[#2a3a45]"
          >
            Quiz starten
          </button>
        </div>
      </div>
    </div>
  );
}
