// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import type { QuestionWithOptions } from "@/types";
import QuestionForm from "./QuestionForm";
import DeleteQuestionButton from "./DeleteQuestionButton";

const TYPE_LABELS: Record<string, string> = {
  LIKERT: "Likert (1-5)",
  SLIDER: "Schieberegler",
  YES_NO: "Ja / Nein",
  SINGLE_CHOICE: "Einzelauswahl",
  MULTI_CHOICE: "Mehrfachauswahl",
};

interface QuestionListProps {
  questions: QuestionWithOptions[];
}

export default function QuestionList({ questions }: QuestionListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl uppercase">Quiz-Fragen</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{questions.length} Fragen</span>
          {!showCreateForm && (
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingId(null);
              }}
              className="bg-foreground text-primary-foreground font-heading uppercase px-4 py-2 text-sm"
            >
              Neue Frage
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <QuestionForm onClose={() => setShowCreateForm(false)} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={q.id}>
            {editingId === q.id ? (
              <QuestionForm question={q} onClose={() => setEditingId(null)} />
            ) : (
              <div className="border-2 border-foreground/20 bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="font-medium">{q.text}</p>
                      {q.helpText && (
                        <p className="mt-1 text-xs text-muted-foreground">{q.helpText}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                      {TYPE_LABELS[q.type] ?? q.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Gew. {q.weight}
                    </span>
                  </div>
                </div>
                {q.options.length > 0 && (
                  <ul className="mt-2 ml-7 flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <li
                        key={opt.id}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 ml-7 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(q.id);
                      setShowCreateForm(false);
                    }}
                    className="border-2 border-foreground/30 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    Bearbeiten
                  </button>
                  <DeleteQuestionButton questionId={q.id} questionText={q.text} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
