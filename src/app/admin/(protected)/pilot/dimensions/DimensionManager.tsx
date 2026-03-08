// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  dimensionId: string | null;
  text: string;
  order: number;
  isInverse?: boolean;
}

interface DimensionWithQuestions {
  id: string;
  label: string;
  emoji: string;
  description: string;
  blockIndex: number;
  order: number;
  questions: Question[];
}

interface Props {
  initialDimensions: DimensionWithQuestions[];
  initialStandalone: Question[];
}

const BLOCK_LABELS = ["Block 1", "Block 2", "Block 3", "Block 4"];

export function DimensionManager({ initialDimensions, initialStandalone }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingDim, setEditingDim] = useState<string | null>(null);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [showNewDim, setShowNewDim] = useState(false);
  const [addingQuestionTo, setAddingQuestionTo] = useState<string | null>(null);
  const [showNewStandalone, setShowNewStandalone] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export / Import ──────────────────────────────────────────

  function handleExport() {
    const data = {
      dimensions: initialDimensions.map((d) => ({
        id: d.id,
        label: d.label,
        emoji: d.emoji,
        description: d.description,
        blockIndex: d.blockIndex,
        order: d.order,
        questions: d.questions.map((q) => ({
          id: q.id,
          dimensionId: q.dimensionId,
          text: q.text,
          order: q.order,
          isInverse: q.isInverse ?? false,
        })),
      })),
      standaloneQuestions: initialStandalone.map((q) => ({
        id: q.id,
        text: q.text,
        order: q.order,
        isInverse: q.isInverse ?? false,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilot-dimensions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    let parsed;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      alert("Datei konnte nicht gelesen werden. Bitte eine gültige JSON-Datei wählen.");
      return;
    }

    const dimCount = parsed?.dimensions?.length ?? 0;
    const qCount = parsed?.dimensions?.reduce((s: number, d: { questions?: unknown[] }) => s + (d.questions?.length ?? 0), 0) ?? 0;
    const sCount = parsed?.standaloneQuestions?.length ?? 0;
    if (!confirm(`Import: ${dimCount} Dimensionen mit ${qCount} Fragen + ${sCount} Standalone-Items. Alle bestehenden Daten werden ersetzt. Fortfahren?`)) return;

    setBusy(true);
    const res = await fetch("/api/admin/pilot/dimensions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    setBusy(false);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Import fehlgeschlagen");
      return;
    }

    router.refresh();
  }

  // ── Dimension CRUD ─────────────────────────────────────────

  async function createDimension(data: {
    id: string;
    label: string;
    emoji: string;
    description: string;
    blockIndex: number;
    order: number;
  }) {
    setBusy(true);
    const res = await fetch("/api/admin/pilot/dimensions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Fehler beim Erstellen");
      return;
    }
    setShowNewDim(false);
    router.refresh();
  }

  async function updateDimension(
    id: string,
    data: Partial<DimensionWithQuestions>,
  ) {
    setBusy(true);
    const res = await fetch(`/api/admin/pilot/dimensions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Fehler beim Speichern");
      return;
    }
    setEditingDim(null);
    router.refresh();
  }

  async function deleteDimension(id: string) {
    if (!confirm(`Dimension ${id} und alle zugehörigen Fragen löschen?`))
      return;
    setBusy(true);
    await fetch(`/api/admin/pilot/dimensions/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  // ── Question CRUD ──────────────────────────────────────────

  async function createQuestion(data: {
    id: string;
    dimensionId: string | null;
    text: string;
    order: number;
  }) {
    setBusy(true);
    const res = await fetch("/api/admin/pilot/survey-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Fehler beim Erstellen");
      return;
    }
    setAddingQuestionTo(null);
    setShowNewStandalone(false);
    router.refresh();
  }

  async function updateQuestion(id: string, data: { text?: string; order?: number; isInverse?: boolean }) {
    setBusy(true);
    const res = await fetch(`/api/admin/pilot/survey-questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Fehler beim Speichern");
      return;
    }
    setEditingQ(null);
    router.refresh();
  }

  async function deleteQuestion(id: string) {
    if (!confirm(`Frage ${id} löschen?`)) return;
    setBusy(true);
    await fetch(`/api/admin/pilot/survey-questions/${id}`, {
      method: "DELETE",
    });
    setBusy(false);
    router.refresh();
  }

  async function toggleInverse(q: Question) {
    await updateQuestion(q.id, { isInverse: !q.isInverse });
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Export / Import */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm border-2 border-foreground font-medium hover:bg-muted transition-colors"
        >
          JSON exportieren
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="px-4 py-2 text-sm border-2 border-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          JSON importieren
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* New Dimension Form */}
      {showNewDim ? (
        <NewDimensionForm
          existingIds={initialDimensions.map((d) => d.id)}
          nextOrder={initialDimensions.length + 1}
          onSave={createDimension}
          onCancel={() => setShowNewDim(false)}
          busy={busy}
        />
      ) : (
        <button
          onClick={() => setShowNewDim(true)}
          className="border-2 border-dashed border-foreground/30 px-4 py-3 text-sm font-medium hover:border-foreground transition-colors w-full"
        >
          + Neue Dimension
        </button>
      )}

      {/* Dimension Cards */}
      {initialDimensions.map((dim) => {
        const isExpanded = expanded === dim.id;
        const isEditing = editingDim === dim.id;

        return (
          <div
            key={dim.id}
            className="border-2 border-foreground bg-card overflow-hidden"
          >
            {/* Dimension Header */}
            {isEditing ? (
              <EditDimensionForm
                dim={dim}
                onSave={(data) => updateDimension(dim.id, data)}
                onCancel={() => setEditingDim(null)}
                busy={busy}
              />
            ) : (
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : dim.id)}
              >
                <span className="text-xl">{dim.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm uppercase">
                      {dim.id}
                    </span>
                    <span className="font-medium">{dim.label}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{dim.questions.length} Fragen</span>
                    <span>{BLOCK_LABELS[dim.blockIndex]}</span>
                    <span>Reihenfolge: {dim.order}</span>
                    {dim.questions.some((q) => q.isInverse) && (
                      <span title="Enthält inverse Items">R</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDim(dim.id);
                    }}
                    className="px-2 py-1 text-xs border border-foreground/30 hover:bg-muted transition-colors"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDimension(dim.id);
                    }}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Löschen
                  </button>
                </div>
                <span className="text-muted-foreground">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            )}

            {/* Questions (expanded) */}
            {isExpanded && (
              <div className="border-t-2 border-foreground">
                {dim.questions.map((q) =>
                  editingQ === q.id ? (
                    <EditQuestionForm
                      key={q.id}
                      question={q}
                      onSave={(data) => updateQuestion(q.id, data)}
                      onCancel={() => setEditingQ(null)}
                      busy={busy}
                    />
                  ) : (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 px-4 py-2.5 border-b border-foreground/10 last:border-b-0 hover:bg-muted/10"
                    >
                      <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">
                        {q.id}
                      </span>
                      {q.isInverse && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded shrink-0 mt-0.5" title="Inverses Item">
                          R
                        </span>
                      )}
                      <p className="flex-1 text-sm">{q.text}</p>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleInverse(q)}
                          disabled={busy}
                          className={`px-1.5 py-0.5 text-xs border transition-colors ${
                            q.isInverse
                              ? "border-amber-400 bg-amber-50 text-amber-800"
                              : "border-foreground/20 hover:bg-muted"
                          }`}
                          title={q.isInverse ? "Inversion entfernen" : "Als invers markieren"}
                        >
                          R
                        </button>
                        <button
                          onClick={() => setEditingQ(q.id)}
                          className="px-1.5 py-0.5 text-xs border border-foreground/20 hover:bg-muted transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="px-1.5 py-0.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ),
                )}

                {/* Add Question */}
                {addingQuestionTo === dim.id ? (
                  <NewQuestionForm
                    dimensionId={dim.id}
                    nextOrder={dim.questions.length + 1}
                    nextIndex={dim.questions.length + 1}
                    onSave={createQuestion}
                    onCancel={() => setAddingQuestionTo(null)}
                    busy={busy}
                  />
                ) : (
                  <button
                    onClick={() => setAddingQuestionTo(dim.id)}
                    className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors border-t border-foreground/10"
                  >
                    + Frage hinzufügen
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Standalone Items ───────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="font-heading text-lg uppercase mb-3">Standalone Items</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Einzelfragen ohne Dimensions-Zuordnung. Werden im Pilot mitgetestet, aber nur mit SD bewertet (kein Alpha/r_it).
        </p>

        {initialStandalone.map((q) =>
          editingQ === q.id ? (
            <EditQuestionForm
              key={q.id}
              question={q}
              onSave={(data) => updateQuestion(q.id, data)}
              onCancel={() => setEditingQ(null)}
              busy={busy}
            />
          ) : (
            <div
              key={q.id}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-foreground/10 hover:bg-muted/10"
            >
              <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">
                {q.id}
              </span>
              {q.isInverse && (
                <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded shrink-0 mt-0.5" title="Inverses Item">
                  R
                </span>
              )}
              <p className="flex-1 text-sm">{q.text}</p>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditingQ(q.id)}
                  className="px-1.5 py-0.5 text-xs border border-foreground/20 hover:bg-muted transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="px-1.5 py-0.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          ),
        )}

        {showNewStandalone ? (
          <NewStandaloneForm
            nextOrder={initialStandalone.length + 1}
            nextIndex={initialStandalone.length + 1}
            onSave={(data) => createQuestion({ ...data, dimensionId: null })}
            onCancel={() => setShowNewStandalone(false)}
            busy={busy}
          />
        ) : (
          <button
            onClick={() => setShowNewStandalone(true)}
            className="border-2 border-dashed border-foreground/30 px-4 py-3 text-sm font-medium hover:border-foreground transition-colors w-full mt-2"
          >
            + Standalone Item
          </button>
        )}
      </div>
    </div>
  );
}

// ── Inline Forms ──────────────────────────────────────────────

function NewDimensionForm({
  existingIds,
  nextOrder,
  onSave,
  onCancel,
  busy,
}: {
  existingIds: string[];
  nextOrder: number;
  onSave: (data: { id: string; label: string; emoji: string; description: string; blockIndex: number; order: number }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const nextNum =
    existingIds
      .map((id) => parseInt(id.replace("D", ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0) + 1;

  const [id, setId] = useState(`D${nextNum}`);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [description, setDescription] = useState("");
  const [blockIndex, setBlockIndex] = useState(0);

  return (
    <div className="border-2 border-foreground bg-card p-4 space-y-3">
      <h3 className="font-heading text-sm uppercase">Neue Dimension</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          ID
          <input value={id} onChange={(e) => setId(e.target.value)} className="border px-2 py-1.5 text-sm" placeholder="D11" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Emoji
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="border px-2 py-1.5 text-sm" placeholder="🎯" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Label
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="border px-2 py-1.5 text-sm w-full" placeholder="Dimension Name" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Beschreibung
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="border px-2 py-1.5 text-sm w-full" placeholder="Kurze Beschreibung" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Block (Variante)
        <select value={blockIndex} onChange={(e) => setBlockIndex(Number(e.target.value))} className="border px-2 py-1.5 text-sm">
          {BLOCK_LABELS.map((lbl, i) => (
            <option key={i} value={i}>{lbl}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          disabled={busy || !id || !label}
          onClick={() => onSave({ id, label, emoji, description, blockIndex, order: nextOrder })}
          className="px-4 py-2 text-sm bg-foreground text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          Erstellen
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm border hover:bg-muted">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function EditDimensionForm({
  dim,
  onSave,
  onCancel,
  busy,
}: {
  dim: DimensionWithQuestions;
  onSave: (data: Partial<DimensionWithQuestions>) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [label, setLabel] = useState(dim.label);
  const [emoji, setEmoji] = useState(dim.emoji);
  const [description, setDescription] = useState(dim.description);
  const [blockIndex, setBlockIndex] = useState(dim.blockIndex);
  const [order, setOrder] = useState(dim.order);

  return (
    <div className="px-4 py-3 space-y-3 bg-muted/20">
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Emoji
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="border px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm col-span-2">
          Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="border px-2 py-1.5 text-sm w-full" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Beschreibung
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="border px-2 py-1.5 text-sm w-full" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Block
          <select value={blockIndex} onChange={(e) => setBlockIndex(Number(e.target.value))} className="border px-2 py-1.5 text-sm">
            {BLOCK_LABELS.map((lbl, i) => (
              <option key={i} value={i}>{lbl}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Reihenfolge
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="border px-2 py-1.5 text-sm" />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          disabled={busy}
          onClick={() => onSave({ label, emoji, description, blockIndex, order })}
          className="px-4 py-2 text-sm bg-foreground text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          Speichern
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm border hover:bg-muted">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function EditQuestionForm({
  question,
  onSave,
  onCancel,
  busy,
}: {
  question: Question;
  onSave: (data: { text?: string; order?: number; isInverse?: boolean }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [text, setText] = useState(question.text);
  const [order, setOrder] = useState(question.order);
  const [isInverse, setIsInverse] = useState(question.isInverse ?? false);

  return (
    <div className="px-4 py-2.5 border-b border-foreground/10 bg-muted/10 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono">{question.id}</span>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="border px-2 py-1 text-xs w-16"
          placeholder="Reihenfolge"
        />
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={isInverse}
            onChange={(e) => setIsInverse(e.target.checked)}
            className="w-3.5 h-3.5"
          />
          Invers
        </label>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="border px-2 py-1.5 text-sm w-full resize-none"
      />
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => onSave({ text, order, isInverse })}
          className="px-3 py-1 text-xs bg-foreground text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          Speichern
        </button>
        <button onClick={onCancel} className="px-3 py-1 text-xs border hover:bg-muted">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function NewQuestionForm({
  dimensionId,
  nextOrder,
  nextIndex,
  onSave,
  onCancel,
  busy,
}: {
  dimensionId: string;
  nextOrder: number;
  nextIndex: number;
  onSave: (data: { id: string; dimensionId: string | null; text: string; order: number }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [id, setId] = useState(`${dimensionId}Q${nextIndex}`);
  const [text, setText] = useState("");

  return (
    <div className="px-4 py-2.5 border-t border-foreground/10 bg-muted/10 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="border px-2 py-1 text-xs font-mono w-24"
          placeholder="D1Q7"
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="border px-2 py-1.5 text-sm w-full resize-none"
        placeholder="Fragentext..."
      />
      <div className="flex gap-2">
        <button
          disabled={busy || !id || !text}
          onClick={() => onSave({ id, dimensionId, text, order: nextOrder })}
          className="px-3 py-1 text-xs bg-foreground text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          Hinzufügen
        </button>
        <button onClick={onCancel} className="px-3 py-1 text-xs border hover:bg-muted">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function NewStandaloneForm({
  nextOrder,
  nextIndex,
  onSave,
  onCancel,
  busy,
}: {
  nextOrder: number;
  nextIndex: number;
  onSave: (data: { id: string; text: string; order: number }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [id, setId] = useState(`S${nextIndex}`);
  const [text, setText] = useState("");

  return (
    <div className="border-2 border-foreground bg-card p-4 space-y-3 mt-2">
      <h3 className="font-heading text-sm uppercase">Neues Standalone Item</h3>
      <div className="flex items-center gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="border px-2 py-1 text-xs font-mono w-24"
          placeholder="S1"
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="border px-2 py-1.5 text-sm w-full resize-none"
        placeholder="Fragentext..."
      />
      <div className="flex gap-2">
        <button
          disabled={busy || !id || !text}
          onClick={() => onSave({ id, text, order: nextOrder })}
          className="px-3 py-1 text-xs bg-foreground text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          Hinzufügen
        </button>
        <button onClick={onCancel} className="px-3 py-1 text-xs border hover:bg-muted">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
