// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuizThesisData } from "@/lib/quiz/types";
import type { Persona } from "./personas";
import { ANSWER_LABELS } from "./personas";

interface DemoPersonaAnswersProps {
  persona: Persona;
  theses: QuizThesisData[];
}

export function DemoPersonaAnswers({ persona, theses }: DemoPersonaAnswersProps) {
  return (
    <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
      {theses.map((thesis) => {
        const answer = persona.answersByTitle[thesis.shortTitle];
        const info = answer ? ANSWER_LABELS[answer] : null;
        return (
          <div
            key={thesis.id}
            className="flex items-center gap-3 rounded border border-[#1a2a35]/10 bg-white px-3 py-2"
          >
            <span
              className="shrink-0 w-6 text-center text-sm font-bold"
              style={{ color: info?.color ?? "#9ca3af" }}
            >
              {info?.symbol ?? "?"}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#1a2a35] truncate block">{thesis.shortTitle}</span>
              <span className="text-[10px] text-[#7a9aaa] truncate block">{thesis.text}</span>
            </div>
            {info && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: `${info.color}18`, color: info.color }}
              >
                {info.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
