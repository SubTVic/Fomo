// SPDX-License-Identifier: AGPL-3.0-only
// Priming screen: sets the "Hochschulgruppen" context frame before the survey begins.
// The continue button is disabled for 4 seconds to ensure participants read the text.

"use client";

import { useState, useEffect } from "react";

const EXAMPLE_CHIPS = [
  { emoji: "\uD83C\uDFC6", label: "Sportteams & Wettkampfgruppen" },
  { emoji: "\uD83C\uDFA8", label: "Kultur, Musik & Kreativprojekte" },
  { emoji: "\uD83D\uDCE2", label: "Politische Initiativen & soziales Engagement" },
  { emoji: "\uD83D\uDCBB", label: "Tech-Projekte & Fachgruppen" },
  { emoji: "\uD83C\uDF0D", label: "Internationale Netzwerke & Austausch" },
  { emoji: "\uD83C\uDFAD", label: "Theater, Film & Medien" },
  { emoji: "\uD83C\uDF31", label: "Umwelt & Nachhaltigkeit" },
  { emoji: "\uD83D\uDCDA", label: "Fachschaften & Studiengruppen" },
];

const LOCK_SECONDS = 4;

interface PrimingScreenProps {
  onContinue: () => void;
}

export function PrimingScreen({ onContinue }: PrimingScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(LOCK_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const locked = secondsLeft > 0;

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full flex flex-col items-center gap-6 text-center">
        <div className="text-5xl">&#127891;</div>

        <h1 className="text-2xl font-bold text-gray-900">
          Bevor es losgeht &ndash; Wor&uuml;ber wir reden
        </h1>

        <p className="text-base text-gray-700 leading-relaxed">
          Die folgenden Fragen drehen sich um <strong>Hochschulgruppen an der TU Dresden</strong> &ndash;
          also studentische Initiativen, Vereine, Teams und Projekte neben dem Studium.
        </p>

        <p className="text-base text-gray-700 leading-relaxed">
          Stell dir vor, du &uuml;berlegst gerade, einer solchen Gruppe beizutreten.
          Beantworte alle Fragen aus dieser Perspektive:{" "}
          <strong>Was w&uuml;rdest du dir von einer Hochschulgruppe w&uuml;nschen?</strong>
        </p>

        {/* Example chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_CHIPS.map(({ emoji, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-3 py-1.5 text-sm text-gray-700"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-500">
          Es gibt keine richtigen oder falschen Antworten.
          Antworte so, wie es sich f&uuml;r dich stimmig anf&uuml;hlt.
        </p>

        <button
          onClick={onContinue}
          disabled={locked}
          className={`w-full max-w-xs rounded-xl py-4 font-semibold text-lg transition-all ${
            locked
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary text-primary-foreground active:scale-[0.98]"
          }`}
        >
          {locked ? `Bitte lies den Text (${secondsLeft}s)` : "Verstanden, los geht\u2019s!"}
        </button>
      </div>
    </div>
  );
}
