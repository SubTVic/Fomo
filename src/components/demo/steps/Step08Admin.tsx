// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import type { StepProps } from "./types";

const SCREENSHOTS = [
  { src: "/demo-screenshots/admin-groups.png", label: "Gruppen-Verwaltung" },
  { src: "/demo-screenshots/admin-quiz.png",   label: "Quiz-Editor" },
  { src: "/demo-screenshots/admin-pilot.png",  label: "Pilot-Statistiken" },
];

export function Step08Admin({ groups, theses }: StepProps) {
  const [idx, setIdx] = useState(0);

  const features = [
    { icon: "🏛️", title: "Gruppen verwalten", desc: `${groups.length} Hochschulgruppen mit Profilen, Kontaktdaten und 17 Matching-Attributen` },
    { icon: "❓", title: "Quiz-Thesen", desc: `${theses.length} Thesen erstellen, bearbeiten, per JSON importieren` },
    { icon: "🎨", title: "Layout wählen", desc: "Aktive Quiz-Variante per Klick umschalten" },
    { icon: "📊", title: "Pilot-Statistiken", desc: "Abschlussraten, Antwort-Heatmaps, CSV-Export" },
    { icon: "✉️", title: "Einladungen", desc: "Token-basierte Links an Gruppen senden zur Selbstregistrierung" },
    { icon: "✅", title: "Verifizierung", desc: "Gruppen-Profile nach Selbstauskunft manuell freigeben" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">Schritt 9</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Admin-Panel
        </h2>
        <p className="mt-2 text-sm text-[#5a7a8a]">
          Vollständiges CMS für StuRa-Redakteure — ohne Programmierkenntnisse.
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
              aria-label="Vorheriges"
            >
              ←
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % SCREENSHOTS.length)}
              className="text-[#ADD8E6] hover:text-white transition-colors px-1"
              aria-label="Nächstes"
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
        <strong className="text-[#ADD8E6]">Technisch:</strong>{" "}
        Next.js 15, PostgreSQL, Prisma ORM, Auth.js. Deployed via Docker Compose — läuft auf dem Uni-Server ohne externe Abhängigkeiten. Open Source (AGPL-3.0).
      </div>
    </div>
  );
}
