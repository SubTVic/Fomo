// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestionWithOptions } from "@/types";

type QuestionType = "LIKERT" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "YES_NO" | "SLIDER";

interface OptionField {
  id?: string;
  label: string;
  value: string;
  order: number;
}

interface QuestionFormProps {
  question?: QuestionWithOptions;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "LIKERT", label: "Likert (1-5)" },
  { value: "YES_NO", label: "Ja / Nein" },
  { value: "SINGLE_CHOICE", label: "Einzelauswahl" },
  { value: "MULTI_CHOICE", label: "Mehrfachauswahl" },
  { value: "SLIDER", label: "Schieberegler" },
];

export default function QuestionForm({ question, onClose }: QuestionFormProps) {
  const router = useRouter();
  const isEditing = !!question;

  const [text, setText] = useState(question?.text ?? "");
  const [type, setType] = useState<QuestionType>((question?.type as QuestionType) ?? "LIKERT");
  const [order, setOrder] = useState(question?.order ?? 0);
  const [weight, setWeight] = useState(question?.weight ?? 1.0);
  const [helpText, setHelpText] = useState(question?.helpText ?? "");
  const [categoryTag, setCategoryTag] = useState(question?.categoryTag ?? "");
  const [isRequired, setIsRequired] = useState(question?.isRequired ?? true);

  // Slider fields
  const [sliderMin, setSliderMin] = useState(question?.sliderMin ?? 0);
  const [sliderMax, setSliderMax] = useState(question?.sliderMax ?? 100);
  const [sliderStep, setSliderStep] = useState(question?.sliderStep ?? 1);
  const [sliderMinLabel, setSliderMinLabel] = useState(question?.sliderMinLabel ?? "");
  const [sliderMaxLabel, setSliderMaxLabel] = useState(question?.sliderMaxLabel ?? "");

  // Options for SINGLE_CHOICE / MULTI_CHOICE
  const [options, setOptions] = useState<OptionField[]>(
    question?.options?.map((o) => ({ id: o.id, label: o.label, value: o.value, order: o.order })) ??
      [
        { label: "", value: "", order: 0 },
        { label: "", value: "", order: 1 },
      ],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsOptions = type === "SINGLE_CHOICE" || type === "MULTI_CHOICE";
  const isSlider = type === "SLIDER";

  function addOption() {
    setOptions((prev) => [...prev, { label: "", value: "", order: prev.length }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index).map((o, i) => ({ ...o, order: i })));
  }

  function updateOption(index: number, field: "label" | "value", val: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: val } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      text,
      type,
      order,
      weight,
      isRequired,
      helpText: helpText || null,
      categoryTag: categoryTag || null,
      sliderMin: isSlider ? sliderMin : null,
      sliderMax: isSlider ? sliderMax : null,
      sliderStep: isSlider ? sliderStep : null,
      sliderMinLabel: isSlider ? sliderMinLabel || null : null,
      sliderMaxLabel: isSlider ? sliderMaxLabel || null : null,
      options: needsOptions ? options : undefined,
    };

    try {
      const url = isEditing
        ? `/api/admin/questions/${question.id}`
        : "/api/admin/questions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.formErrors?.[0] ?? data.error?.fieldErrors?.options?.[0] ?? "Fehler beim Speichern";
        setError(msg);
        setSubmitting(false);
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Netzwerkfehler");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-foreground bg-card p-6">
      <h2 className="font-heading text-lg uppercase mb-4">
        {isEditing ? "Frage bearbeiten" : "Neue Frage"}
      </h2>

      {error && (
        <div className="mb-4 border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Text */}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-muted-foreground">Fragetext *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={3}
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
        />
      </div>

      {/* Type + Order + Weight row */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Typ *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Reihenfolge</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            min={0}
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Gewichtung</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={0}
            step={0.1}
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* HelpText + CategoryTag */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Hilfetext</label>
          <input
            type="text"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Kategorie-Tag</label>
          <input
            type="text"
            value={categoryTag}
            onChange={(e) => setCategoryTag(e.target.value)}
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* isRequired */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="border-2 border-foreground/30"
          />
          <span className="text-muted-foreground">Pflichtfrage</span>
        </label>
      </div>

      {/* Slider fields */}
      {isSlider && (
        <div className="mb-4 border-2 border-foreground/10 p-4">
          <h3 className="font-heading text-sm uppercase mb-3">Schieberegler-Optionen</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Min</label>
              <input
                type="number"
                value={sliderMin}
                onChange={(e) => setSliderMin(Number(e.target.value))}
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Max</label>
              <input
                type="number"
                value={sliderMax}
                onChange={(e) => setSliderMax(Number(e.target.value))}
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Schrittweite</label>
              <input
                type="number"
                value={sliderStep}
                onChange={(e) => setSliderStep(Number(e.target.value))}
                min={1}
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Min-Label</label>
              <input
                type="text"
                value={sliderMinLabel}
                onChange={(e) => setSliderMinLabel(e.target.value)}
                placeholder='z.B. "Gar nicht wichtig"'
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Max-Label</label>
              <input
                type="text"
                value={sliderMaxLabel}
                onChange={(e) => setSliderMaxLabel(e.target.value)}
                placeholder='z.B. "Sehr wichtig"'
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Options for choice types */}
      {needsOptions && (
        <div className="mb-4 border-2 border-foreground/10 p-4">
          <h3 className="font-heading text-sm uppercase mb-3">Antwortoptionen</h3>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground w-6 text-right">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => updateOption(i, "label", e.target.value)}
                  placeholder="Label"
                  required
                  className="flex-1 border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => updateOption(i, "value", e.target.value)}
                  placeholder="Wert"
                  required
                  className="w-32 border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="shrink-0 border-2 border-foreground/30 px-2 py-1 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-3 border-2 border-foreground/30 px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            + Option hinzufuegen
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-foreground text-primary-foreground font-heading uppercase px-4 py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Speichern..." : isEditing ? "Aktualisieren" : "Erstellen"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border-2 border-foreground/30 px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
