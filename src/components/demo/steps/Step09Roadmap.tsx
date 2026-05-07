// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { StepProps } from "./types";

const TIMELINE = [
  {
    phase: "Phase 1",
    date: "März – Mai 2026",
    title: "Pilot-Studie",
    status: "done",
    items: ["67 Sessions abgeschlossen", "Classic-Layout gewinnt (45%)", "Working Set v1.1 eingefroren", "19 finale Quiz-Fragen"],
  },
  {
    phase: "Phase 2",
    date: "Mai – Juni 2026",
    title: "Gruppen-Registrierung",
    status: "now",
    items: ["83 Gruppen erhalten Token-Links", "Selbstauskunft zu 17 Attributen", "Admin verifiziert Profile", "Algorithmus kalibriert"],
  },
  {
    phase: "Phase 3",
    date: "Mai – August 2026",
    title: "Live-Quiz + Matching",
    status: "planned",
    items: ["~20 finale Fragen live", "Echtzeit-Matching im Browser", "Ergebnisseite mit Top-Gruppen", "Wahl-O-Mat Vergleichstabelle"],
  },
  {
    phase: "Phase 4",
    date: "September 2026",
    title: "Launch zur Erstsemester-Woche",
    status: "planned",
    items: ["6.300 Erstis als Zielgruppe", "Integration StuRa-Website", "Gamification: Badges, Share-Cards", "Monitoring & Auswertung"],
  },
];

const FUTURE = [
  { emoji: "🎯", title: "Radar-Chart", desc: "Persönlichkeitsprofil mit 8 Dimensionen" },
  { emoji: "🃏", title: "Share-Cards", desc: "Ergebnis als Instagram-Story teilen" },
  { emoji: "📅", title: "Event-Übersicht", desc: "Personalisierte Veranstaltungsempfehlungen basierend auf dem Quiz-Ergebnis" },
  { emoji: "🏫", title: "Andere Hochschulen", desc: "Leipzig, Chemnitz, bundesweit skalierbar" },
  { emoji: "🔗", title: "SSO-Login", desc: "TU-Account direkt, keine Extra-Registrierung" },
  { emoji: "📱", title: "Native App", desc: "iOS/Android — langfristige Vision" },
];

export function Step09Roadmap({}: StepProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2a35]/50">Schritt 10</p>
        <h2
          className="mt-1 text-3xl uppercase text-[#1a2a35]"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Roadmap
        </h2>
        <p className="mt-2 text-sm text-[#5a7a8a]">Phase 1 abgeschlossen · Phase 2 läuft · Launch September 2026.</p>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {TIMELINE.map((t) => (
          <div
            key={t.phase}
            className={`border-4 p-4 ${
              t.status === "done"
                ? "border-green-600 bg-green-50"
                : t.status === "now"
                ? "border-[#1a2a35] bg-[#1a2a35] text-white"
                : "border-[#1a2a35]/30 bg-white opacity-80"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {t.status === "done" && (
                  <span className="rounded-full bg-green-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                    ✓ Abgeschlossen
                  </span>
                )}
                {t.status === "now" && (
                  <span className="rounded-full bg-[#ADD8E6] px-2 py-0.5 text-[9px] font-bold text-[#1a2a35] uppercase">
                    Jetzt
                  </span>
                )}
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    t.status === "done" ? "text-green-700" : t.status === "now" ? "text-[#ADD8E6]" : "text-[#5a7a8a]"
                  }`}
                >
                  {t.phase} · {t.date}
                </span>
              </div>
            </div>
            <p className={`font-bold text-sm ${t.status === "now" ? "text-white" : "text-[#1a2a35]"}`}>
              {t.title}
            </p>
            <ul className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs ${t.status === "now" ? "text-[#ADD8E6]/80" : t.status === "done" ? "text-green-700/70" : "text-[#5a7a8a]"}`}>
              {t.items.map((item) => (
                <li key={item}>{t.status === "done" ? "✓" : "·"} {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Future features */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#1a2a35] mb-2">Geplante Features (nach Launch)</p>
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
        <p className="text-white font-bold">Interesse an FOMO?</p>
        <p className="text-[#ADD8E6]/70 text-sm">
          Eine Idee aus der Hochschulgruppe YETI Dresden — im Auftrag des StuRa TU Dresden.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/quiz"
            className="rounded border-2 border-[#ADD8E6] px-4 py-2 text-sm font-bold text-[#ADD8E6] hover:bg-[#ADD8E6]/10 transition-colors"
          >
            Quiz starten
          </a>
          <a
            href="https://github.com/SubTVic/Fomo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border-2 border-[#ADD8E6]/40 px-4 py-2 text-sm text-[#ADD8E6]/70 hover:border-[#ADD8E6] transition-colors"
          >
            GitHub →
          </a>
        </div>
      </div>
    </div>
  );
}
