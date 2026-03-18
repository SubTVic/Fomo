// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuizMatchResult } from "@/lib/quiz/types";
import type { Persona } from "./personas";

interface DemoResultsProps {
  persona: Persona;
  results: QuizMatchResult[];
  compact?: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function scoreColor(score: number) {
  if (score >= 66) return { bar: "bg-green-500", text: "text-green-700" };
  if (score >= 33) return { bar: "bg-yellow-500", text: "text-yellow-700" };
  return { bar: "bg-red-400", text: "text-red-600" };
}

export function DemoResults({ persona, results, compact = false }: DemoResultsProps) {
  const shown = compact ? results.slice(0, 5) : results.slice(0, 8);

  return (
    <div className="space-y-2">
      {/* Persona header */}
      <div
        className="flex items-center gap-3 rounded border-2 p-3"
        style={{ borderColor: persona.color, background: `${persona.color}12` }}
      >
        <span className="text-2xl">{persona.emoji}</span>
        <div>
          <p className="font-bold text-sm" style={{ color: persona.color }}>{persona.name}</p>
          <p className="text-xs text-[#5a7a8a]">{persona.study}</p>
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
        {shown.map((r, i) => {
          const colors = scoreColor(r.score);
          return (
            <div key={r.group.id} className="flex items-center gap-2.5 rounded border border-[#1a2a35]/10 bg-white px-3 py-2">
              <span className="shrink-0 w-6 text-center text-sm">
                {i < 3 ? MEDALS[i] : <span className="text-xs text-[#7a9aaa]">#{i + 1}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1a2a35] truncate">{r.group.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-[#e8f4f8] overflow-hidden">
                    <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${r.score}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold tabular-nums ${colors.text}`}>{r.score}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
