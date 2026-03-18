// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import type { StepProps } from "./types";

const LAYOUTS = [
  {
    id: "classic",
    name: "Classic",
    emoji: "📋",
    description: "Eine Frage pro Screen, 3 große Buttons. Bewährtes Wahl-O-Mat-Prinzip. Maximale Fokussierung.",
  },
  {
    id: "swipe",
    name: "Swipe",
    emoji: "👆",
    description: "Tinder-Style Karten. Links wischen = Nein, Rechts = Ja, Hoch = Neutral. Für mobile-native Nutzer.",
  },
  {
    id: "scroll",
    name: "Scroll",
    emoji: "📜",
    description: "Alle Fragen auf einmal sichtbar, nach Themen gruppiert. Für Nutzer die erst einen Überblick wollen.",
  },
  {
    id: "chat",
    name: "Chat",
    emoji: "💬",
    description: "WhatsApp-Style Dialog. FOMO stellt Fragen, du antwortest. Persönlichste Erfahrung.",
  },
];

export function Step07Layouts({}: StepProps) {
  const [active, setActive] = useState("classic");
  const layout = LAYOUTS.find((l) => l.id === active)!;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">Schritt 8</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Die Pilot-Studie
        </h2>
        <p className="mt-2 text-sm text-[#5a7a8a] max-w-md mx-auto">
          Bevor FOMO live geht, testen wir welches Quiz-Layout die höchste Abschlussrate hat.
          Dafür werden 4 Varianten an echten Studierenden getestet.
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
          <p className="text-sm text-[#5a7a8a] leading-relaxed">{layout.description}</p>
        </div>
      </div>

      {/* Study explanation */}
      <div className="border-4 border-[#1a2a35] bg-white p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#1a2a35]">Was die Studie misst</p>
        <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">Fragenqualität</p>
            <p className="text-[#5a7a8a]">Welche der 60 Fragen haben die höchste Aussagekraft?</p>
          </div>
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">Abschlussrate</p>
            <p className="text-[#5a7a8a]">Welches Layout bringt Nutzer ans Ende?</p>
          </div>
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">Zeit</p>
            <p className="text-[#5a7a8a]">Wie lange braucht man pro Layout?</p>
          </div>
          <div className="rounded bg-[#f0f8ff] p-2">
            <p className="font-bold text-[#1a2a35]">Präferenz</p>
            <p className="text-[#5a7a8a]">Welches Layout mögen Nutzer am liebsten?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
