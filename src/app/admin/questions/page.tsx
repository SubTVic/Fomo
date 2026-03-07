// SPDX-License-Identifier: AGPL-3.0-only

import { getAllQuestionsForAdmin } from "@/lib/queries/questions";

const TYPE_LABELS: Record<string, string> = {
  LIKERT: "Likert (1–5)",
  SLIDER: "Schieberegler",
  YES_NO: "Ja / Nein",
  SINGLE_CHOICE: "Einzelauswahl",
  MULTI_CHOICE: "Mehrfachauswahl",
};

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestionsForAdmin();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl uppercase">Quiz-Fragen</h1>
        <span className="text-sm text-muted-foreground">{questions.length} Fragen</span>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={q.id} className="border-2 border-foreground/20 bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                <p className="font-medium">{q.text}</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {TYPE_LABELS[q.type] ?? q.type}
              </span>
            </div>
            {q.options.length > 0 && (
              <ul className="mt-2 ml-7 flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <li key={opt.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
