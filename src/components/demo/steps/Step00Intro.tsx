// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { StepProps } from "./types";

export function Step00Intro({ groups, onNext }: StepProps) {
  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-block border-4 border-[#1a2a35] bg-white px-6 py-3">
            <span
              className="text-4xl uppercase tracking-widest text-[#1a2a35]"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              FOMO
            </span>
          </div>
          <p className="mt-3 text-sm font-medium uppercase tracking-widest text-[#1a2a35]/60">
            Find Our Matching Organizations
          </p>
        </div>

        {/* Problem statement */}
        <div className="border-4 border-[#1a2a35] bg-white p-6 text-center">
          <p className="text-5xl font-black text-[#1a2a35]">6.300</p>
          <p className="mt-1 text-lg text-[#5a7a8a]">neue Erstsemester pro Jahr an der TU Dresden</p>
          <div className="my-4 border-t-2 border-dashed border-[#1a2a35]/10" />
          <p className="text-4xl font-black text-[#1a2a35]">100+</p>
          <p className="mt-1 text-lg text-[#5a7a8a]">Hochschulgruppen — Vereine, Clubs, Initiativen</p>
          <div className="my-4 border-t-2 border-dashed border-[#1a2a35]/10" />
          <p className="text-2xl font-black text-red-500">Keine</p>
          <p className="mt-1 text-lg text-[#5a7a8a]">strukturierte Möglichkeiten, die richtige zu finden</p>
        </div>

        {/* Solution */}
        <div className="border-4 border-[#1a2a35] bg-[#1a2a35] p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#ADD8E6]/70">Die Lösung</p>
          <p className="mt-2 text-xl font-bold text-white leading-relaxed">
            Ein Quiz das in 3 Minuten ermittelt, welche Hochschulgruppen zu dir passen —
            wie Wahl-O-Mat, aber für das Campusleben.
          </p>
        </div>

        {/* Scalability */}
        <div className="border-4 border-[#1a2a35] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1a2a35] mb-3">Das gleiche Problem — überall in Deutschland</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded bg-[#f0f8ff] p-2">
              <p className="font-black text-[#1a2a35]">~30.000</p>
              <p className="text-[#5a7a8a]">Erstis/Jahr<br/>Uni Leipzig</p>
            </div>
            <div className="rounded bg-[#f0f8ff] p-2">
              <p className="font-black text-[#1a2a35]">~45.000</p>
              <p className="text-[#5a7a8a]">Erstis/Jahr<br/>TU München</p>
            </div>
            <div className="rounded bg-[#f0f8ff] p-2">
              <p className="font-black text-[#1a2a35]">~500.000</p>
              <p className="text-[#5a7a8a]">Erstis/Jahr<br/>Deutschland</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#5a7a8a] text-center">
            FOMO ist Open Source — jede Hochschule kann es für sich deployen.
          </p>
        </div>

        {/* Sponsors */}
        <div className="flex items-center justify-center gap-6 text-xs text-[#1a2a35]/50">
          <span>Ein Projekt des</span>
          <span className="font-bold text-[#1a2a35]">StuRa TU Dresden</span>
          <span>·</span>
          <span>Open Source (AGPL-3.0)</span>
          <span>·</span>
          <span>Launch: September 2026</span>
        </div>

        <div className="text-center">
          <button
            onClick={onNext}
            className="rounded border-4 border-[#1a2a35] bg-[#1a2a35] px-8 py-4 text-sm font-bold uppercase tracking-widest text-[#ADD8E6] transition-colors hover:bg-[#2a3a45]"
          >
            Tour starten →
          </button>
        </div>
      </div>
    </div>
  );
}
