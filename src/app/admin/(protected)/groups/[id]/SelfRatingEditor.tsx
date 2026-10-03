// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Value = -1 | 0 | 1;

interface Props {
  groupId: string;
  items: { id: string; text: string }[];
  filters: { attribute: string; label: string }[];
  initial: {
    raterCount: number;
    filterSelections: string[];
    answers: Record<string, number>;
  } | null;
}

const OPTIONS: { value: Value; label: string }[] = [
  { value: 1, label: "Stimme zu" },
  { value: 0, label: "Neutral" },
  { value: -1, label: "Stimme nicht zu" },
];

/** Admin editor for a group's 21 answers, activity filters and rater count. */
export function SelfRatingEditor({ groupId, items, filters, initial }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Value>>(() =>
    Object.fromEntries(items.map((i) => [i.id, (initial?.answers[i.id] ?? 0) as Value])),
  );
  const [selected, setSelected] = useState<string[]>(initial?.filterSelections ?? []);
  const [raterCount, setRaterCount] = useState<1 | 2 | 3>(
    (Math.min(Math.max(initial?.raterCount ?? 1, 1), 3) as 1 | 2 | 3),
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function toggleFilter(attr: string) {
    setSelected((prev) => (prev.includes(attr) ? prev.filter((f) => f !== attr) : [...prev, attr]));
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/self-rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raterCount,
          filterSelections: selected,
          answers: items.map((i) => ({ itemId: i.id, value: answers[i.id] })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({ ok: true, text: "Profil gespeichert (steht im Änderungsprotokoll)." });
        router.refresh();
      } else {
        setFeedback({ ok: false, text: data.error ?? "Fehler beim Speichern." });
      }
    } catch {
      setFeedback({ ok: false, text: "Netzwerkfehler." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {!initial && (
        <p className="border-2 border-yellow-400 bg-yellow-50 px-4 py-2 text-xs text-yellow-900">
          Noch kein eigenes Profil. Speichern legt eines an – es gilt dann als „echt“ und kommt
          ins Quiz, sobald die Gruppe verifiziert ist. Besser: die Gruppe per Bearbeitungslink
          selbst ausfüllen lassen.
        </p>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">Aktivitäten (Filter)</p>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <label key={f.attribute} className="flex items-center gap-1.5 border border-foreground/30 px-2 py-1 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(f.attribute)}
                onChange={() => toggleFilter(f.attribute)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="rater-count">
          Ausgefüllt von
        </label>
        <select
          id="rater-count"
          value={raterCount}
          onChange={(e) => setRaterCount(Number(e.target.value) as 1 | 2 | 3)}
          className="border-2 border-foreground/30 bg-card px-2 py-1 text-sm"
        >
          <option value={1}>1 Person</option>
          <option value={2}>2 Personen</option>
          <option value={3}>3+ Personen</option>
        </select>
      </div>

      <div className="divide-y divide-foreground/10">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="w-14 shrink-0 text-xs text-muted-foreground">{item.id}</span>
            <span className="min-w-[200px] flex-1">{item.text}</span>
            <select
              aria-label={`Antwort ${item.id}`}
              value={answers[item.id]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [item.id]: Number(e.target.value) as Value }))
              }
              className="border-2 border-foreground/30 bg-card px-2 py-1 text-xs"
            >
              {OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-foreground px-4 py-2 text-sm font-semibold uppercase text-background disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Profil speichern"}
        </button>
        {feedback && (
          <span className={`text-sm ${feedback.ok ? "text-green-700" : "text-red-700"}`}>{feedback.text}</span>
        )}
      </div>
    </div>
  );
}
