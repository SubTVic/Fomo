// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_ATTRIBUTE_KEYS, getAttributeLabel } from "@/lib/quiz/attribute-labels";

interface ThesisAttribute {
  id: string;
  attribute: string;
  isInverse: boolean;
  thesisId: string;
}

interface Thesis {
  id: string;
  text: string;
  textEn: string | null;
  shortTitle: string;
  hint: string | null;
  hintEn: string | null;
  order: number;
  isActive: boolean;
  attributes: ThesisAttribute[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialTheses: Thesis[];
}

const IMPORT_TEMPLATE = JSON.stringify(
  [
    {
      shortTitle: "Zeitaufwand",
      text: "Ich kann mir vorstellen, mehr als 5 Stunden pro Woche für eine Hochschulgruppe aufzuwenden.",
      order: 1,
      attributes: [{ attribute: "timeLow", isInverse: true }],
    },
    {
      shortTitle: "Karriere",
      text: "Mir ist wichtig, durch Aktivitäten meine Karrierechancen zu verbessern.",
      order: 2,
      attributes: [
        { attribute: "career", isInverse: false },
        { attribute: "networking", isInverse: false },
      ],
    },
  ],
  null,
  2,
);

export function QuizThesisManager({ initialTheses }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("These wirklich löschen?")) return;
    await fetch(`/api/admin/quiz/theses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function downloadTemplate() {
    const blob = new Blob([IMPORT_TEMPLATE], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-thesen-template.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>, mode: "append" | "replace") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImportError(null);
    setImporting(true);

    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      setImportError("Datei konnte nicht gelesen werden. Gültige JSON-Datei?");
      setImporting(false);
      return;
    }

    const body = Array.isArray(parsed) ? { theses: parsed, mode } : parsed;

    const res = await fetch("/api/admin/quiz/theses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setImporting(false);

    if (!res.ok) {
      setImportError(data.error ?? "Import fehlgeschlagen");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Thesis list */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{initialTheses.length} Thesen</p>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Template download */}
          <button
            onClick={downloadTemplate}
            className="rounded border-2 border-foreground px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors"
            title="JSON-Template herunterladen"
          >
            ↓ Template
          </button>

          {/* Import: append */}
          <label className={`cursor-pointer rounded border-2 border-foreground px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            {importing ? "Importiere…" : "↑ Importieren"}
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => handleFileImport(e, "append")}
              disabled={importing}
            />
          </label>

          {/* Import: replace */}
          <label className={`cursor-pointer rounded border-2 border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}
            title="Alle bestehenden Thesen ersetzen">
            ↑ Ersetzen
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => handleFileImport(e, "replace")}
              disabled={importing}
            />
          </label>

          <button
            onClick={() => setShowCreate(true)}
            className="rounded border-2 border-foreground bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + Neue These
          </button>
        </div>
      </div>

      {importError && (
        <div className="rounded border-2 border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {importError}
          <button onClick={() => setImportError(null)} className="ml-2 text-xs underline">Schließen</button>
        </div>
      )}

      {showCreate && (
        <ThesisForm
          onSave={async (data) => {
            setSaving(true);
            await fetch("/api/admin/quiz/theses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            setSaving(false);
            setShowCreate(false);
            router.refresh();
          }}
          onCancel={() => setShowCreate(false)}
          saving={saving}
        />
      )}

      <div className="space-y-2">
        {initialTheses.map((thesis) => (
          <div key={thesis.id} className="border-2 border-foreground bg-card">
            {editingId === thesis.id ? (
              <ThesisForm
                thesis={thesis}
                onSave={async (data) => {
                  setSaving(true);
                  await fetch(`/api/admin/quiz/theses/${thesis.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  setSaving(false);
                  setEditingId(null);
                  router.refresh();
                }}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">#{thesis.order}</span>
                      <span className="font-medium text-sm">{thesis.shortTitle}</span>
                      {!thesis.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inaktiv</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{thesis.text}</p>
                    {thesis.textEn && (
                      <p className="text-xs text-muted-foreground/60 italic mt-0.5">EN: {thesis.textEn}</p>
                    )}
                    {thesis.attributes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {thesis.attributes.map((a) => (
                          <span
                            key={a.id}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              a.isInverse
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {a.isInverse ? "¬ " : ""}{getAttributeLabel(a.attribute)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(thesis.id)}
                      className="rounded border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(thesis.id)}
                      className="rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Thesis edit/create form ──────────────────────────────────────

interface ThesisFormProps {
  thesis?: Thesis;
  onSave: (data: {
    text: string;
    textEn?: string;
    shortTitle: string;
    hint?: string;
    hintEn?: string;
    order: number;
    isActive?: boolean;
    attributes: { attribute: string; isInverse: boolean }[];
  }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function ThesisForm({ thesis, onSave, onCancel, saving }: ThesisFormProps) {
  const [text, setText] = useState(thesis?.text ?? "");
  const [textEn, setTextEn] = useState(thesis?.textEn ?? "");
  const [hint, setHint] = useState(thesis?.hint ?? "");
  const [hintEn, setHintEn] = useState(thesis?.hintEn ?? "");
  const [shortTitle, setShortTitle] = useState(thesis?.shortTitle ?? "");
  const [order, setOrder] = useState(thesis?.order ?? 0);
  const [isActive, setIsActive] = useState(thesis?.isActive ?? true);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      thesis?.attributes.forEach((a) => { map[a.attribute] = true; });
      return map;
    }
  );
  const [inverseAttrs, setInverseAttrs] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      thesis?.attributes.forEach((a) => { if (a.isInverse) map[a.attribute] = true; });
      return map;
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const attributes = ALL_ATTRIBUTE_KEYS
      .filter((key) => selectedAttrs[key])
      .map((key) => ({ attribute: key, isInverse: !!inverseAttrs[key] }));
    onSave({
      text, textEn: textEn || undefined,
      shortTitle,
      hint: hint || undefined, hintEn: hintEn || undefined,
      order, isActive, attributes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-muted/20">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Kurztitel</label>
          <input
            value={shortTitle}
            onChange={(e) => setShortTitle(e.target.value)}
            required
            maxLength={50}
            className="w-full rounded border-2 border-foreground px-2 py-1.5 text-sm bg-background"
            placeholder="z.B. Zeitaufwand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Reihenfolge</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            className="w-20 rounded border-2 border-foreground px-2 py-1.5 text-sm bg-background"
          />
        </div>
        {thesis && (
          <div className="flex items-end">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Aktiv
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">These DE (Ich-Form)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={2}
            className="w-full rounded border-2 border-foreground px-2 py-1.5 text-sm bg-background resize-y"
            placeholder="Ich kann mir vorstellen, mehr als 5 Stunden pro Woche..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">These EN (optional)</label>
          <textarea
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
            rows={2}
            className="w-full rounded border-2 border-foreground/40 px-2 py-1.5 text-sm bg-background resize-y"
            placeholder="I can imagine spending more than 5 hours per week..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Hinweis DE (optional)</label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            maxLength={200}
            className="w-full rounded border-2 border-foreground/40 px-2 py-1.5 text-sm bg-background"
            placeholder="z.B. Religion, Philosophie, Ethik"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Hinweis EN (optional)</label>
          <input
            value={hintEn}
            onChange={(e) => setHintEn(e.target.value)}
            maxLength={200}
            className="w-full rounded border-2 border-foreground/40 px-2 py-1.5 text-sm bg-background"
            placeholder="e.g. Religion, Philosophy, Ethics"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2">Attribut-Mappings</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {ALL_ATTRIBUTE_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={!!selectedAttrs[key]}
                onChange={(e) => {
                  setSelectedAttrs((p) => ({ ...p, [key]: e.target.checked }));
                  if (!e.target.checked) setInverseAttrs((p) => ({ ...p, [key]: false }));
                }}
                className="shrink-0"
              />
              <span className="text-xs truncate">{getAttributeLabel(key)}</span>
              {selectedAttrs[key] && (
                <button
                  type="button"
                  onClick={() => setInverseAttrs((p) => ({ ...p, [key]: !p[key] }))}
                  className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
                    inverseAttrs[key]
                      ? "bg-red-100 text-red-800"
                      : "bg-muted text-muted-foreground"
                  }`}
                  title="Invertiert: Zustimmung = Attribut NICHT vorhanden"
                >
                  INV
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded border-2 border-foreground bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? "Speichere…" : thesis ? "Speichern" : "Erstellen"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border-2 border-foreground px-4 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
