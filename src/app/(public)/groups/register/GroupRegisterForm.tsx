// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getGroupSurveyQuestions,
  getGroupSurveyDimensions,
} from "@/lib/group-survey-questions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1: Stammdaten
  name: string;
  categoryName: string;
  shortDescription: string;
  longDescription: string;
  foundedYear: string;
  motto: string;

  // Step 2: Kontakt
  contactEmail: string;
  contactPerson: string;
  contactPersonRole: string;
  websiteUrl: string;
  instagramUrl: string;

  // Step 3: Struktur
  memberCount: string;
  meetingSchedule: string;
  language: string;
  onboardingInfo: string;

  // Step 4: Profil (answers)
  answers: Record<string, string>;

  // Step 5: Einverständnis
  dataConsent: boolean;
}

const INITIAL: FormData = {
  name: "",
  categoryName: "",
  shortDescription: "",
  longDescription: "",
  foundedYear: "",
  motto: "",
  contactEmail: "",
  contactPerson: "",
  contactPersonRole: "",
  websiteUrl: "",
  instagramUrl: "",
  memberCount: "",
  meetingSchedule: "",
  language: "",
  onboardingInfo: "",
  answers: {},
  dataConsent: false,
};

const CATEGORIES = [
  "Politik & Gesellschaft",
  "Sport & Bewegung",
  "Kunst & Kultur",
  "Musik",
  "Technik & Wissenschaft",
  "Nachhaltigkeit",
  "Internationales",
  "Soziales Engagement",
  "Glaube & Spiritualität",
  "Wirtschaft & Karriere",
  "Sonstiges",
];

const LIKERT_OPTIONS = [
  { value: "1", label: "Trifft gar nicht zu" },
  { value: "2", label: "Trifft eher nicht zu" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Trifft eher zu" },
  { value: "5", label: "Trifft voll zu" },
];

const STEPS = [
  "Stammdaten",
  "Kontakt & Präsenz",
  "Struktur",
  "Quiz-Profil",
  "Abschluss",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function GroupRegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    slug?: string;
    error?: string;
  } | null>(null);

  const questions = getGroupSurveyQuestions();
  const dimensions = getGroupSurveyDimensions();

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setAnswer(questionId: string, value: string) {
    setForm((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }

  // ── Validation ──────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 1) {
      return (
        form.name.trim().length >= 2 &&
        form.categoryName !== "" &&
        form.shortDescription.trim().length >= 10 &&
        form.shortDescription.trim().length <= 200
      );
    }
    if (step === 2) {
      return form.contactEmail.includes("@");
    }
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return form.dataConsent;
    return false;
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryName: form.categoryName,
        shortDescription: form.shortDescription.trim(),
        longDescription: form.longDescription.trim() || undefined,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
        motto: form.motto.trim() || undefined,
        contactEmail: form.contactEmail.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        contactPersonRole: form.contactPersonRole.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        memberCount: form.memberCount || undefined,
        meetingSchedule: form.meetingSchedule.trim() || undefined,
        language: form.language || undefined,
        onboardingInfo: form.onboardingInfo.trim() || undefined,
        answers: form.answers,
        dataConsent: "ja" as const,
      };

      const res = await fetch("/api/groups/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitResult({ success: true, slug: data.slug });
      } else {
        setSubmitResult({ success: false, error: data.error ?? "Unbekannter Fehler" });
      }
    } catch {
      setSubmitResult({ success: false, error: "Netzwerkfehler – bitte erneut versuchen." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (submitResult?.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Registrierung erfolgreich!</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          Eure Gruppe wurde gespeichert und wird nach der Prüfung durch das FOMO-Team
          freigeschaltet. Wir melden uns per E-Mail.
        </p>
        <Link href="/groups" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Zur Gruppenübersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Gruppe registrieren</span>
            <span className="text-xs text-muted-foreground">
              Schritt {step} / {STEPS.length}
            </span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">{STEPS[step - 1]}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {step === 1 && (
          <Step1
            form={form}
            set={set}
          />
        )}
        {step === 2 && (
          <Step2
            form={form}
            set={set}
          />
        )}
        {step === 3 && (
          <Step3
            form={form}
            set={set}
          />
        )}
        {step === 4 && (
          <Step4
            answers={form.answers}
            setAnswer={setAnswer}
            questions={questions}
            dimensions={dimensions}
          />
        )}
        {step === 5 && (
          <Step5
            form={form}
            set={set}
            error={submitResult?.error}
          />
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Zurück
            </button>
          ) : (
            <Link href="/groups" className="text-sm text-muted-foreground hover:text-foreground">
              ← Abbrechen
            </Link>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Weiter →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canAdvance()}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {isSubmitting ? "Wird gespeichert…" : "Absenden"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  const descLen = form.shortDescription.trim().length;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Stammdaten</h2>

      <Field label="Name der Gruppe *">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="z.B. Fachschaftsrat Informatik"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="Kategorie *">
        <select
          value={form.categoryName}
          onChange={(e) => set("categoryName", e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Bitte wählen…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Kurzbeschreibung *"
        hint={`${descLen}/200 Zeichen`}
        error={descLen > 200 ? "Maximal 200 Zeichen" : undefined}
      >
        <textarea
          rows={3}
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder="Was macht eure Gruppe aus? (max. 200 Zeichen)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </Field>

      <Field label="Ausführliche Beschreibung">
        <textarea
          rows={5}
          value={form.longDescription}
          onChange={(e) => set("longDescription", e.target.value)}
          placeholder="Erzählt mehr über eure Geschichte, Ziele und Aktivitäten…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Gründungsjahr">
          <input
            type="number"
            value={form.foundedYear}
            onChange={(e) => set("foundedYear", e.target.value)}
            placeholder="z.B. 2010"
            min={1800}
            max={2030}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Motto / Slogan">
          <input
            type="text"
            value={form.motto}
            onChange={(e) => set("motto", e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>
    </div>
  );
}

function Step2({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Kontakt & Präsenz</h2>

      <Field label="E-Mail-Adresse *" hint="Für Rückfragen und die Bestätigungsmail">
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          placeholder="kontakt@meingruppe.de"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ansprechperson">
          <input
            type="text"
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
            placeholder="Vor- und Nachname"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Rolle">
          <input
            type="text"
            value={form.contactPersonRole}
            onChange={(e) => set("contactPersonRole", e.target.value)}
            placeholder="z.B. Vorsitzende:r"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>

      <Field label="Website">
        <input
          type="url"
          value={form.websiteUrl}
          onChange={(e) => set("websiteUrl", e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="Instagram">
        <input
          type="text"
          value={form.instagramUrl}
          onChange={(e) => set("instagramUrl", e.target.value)}
          placeholder="https://instagram.com/…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
    </div>
  );
}

function Step3({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Struktur</h2>

      <Field label="Mitgliederanzahl (ungefähr)">
        <div className="flex flex-wrap gap-2">
          {["1-10", "11-25", "26-50", "51-100", "100+"].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => set("memberCount", range)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                form.memberCount === range
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Treffen / Aktivitäten" hint="Wann und wie oft trefft ihr euch?">
        <input
          type="text"
          value={form.meetingSchedule}
          onChange={(e) => set("meetingSchedule", e.target.value)}
          placeholder="z.B. Jeden Dienstag 19:00 Uhr im APB"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="Hauptsprache">
        <div className="flex gap-2">
          {[
            { value: "german", label: "Deutsch" },
            { value: "both", label: "Deutsch & Englisch" },
            { value: "english", label: "Englisch" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("language", value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                form.language === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Onboarding" hint="Wie werden neue Mitglieder aufgenommen?">
        <textarea
          rows={4}
          value={form.onboardingInfo}
          onChange={(e) => set("onboardingInfo", e.target.value)}
          placeholder="Beschreibt euren Aufnahmeprozess…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </Field>
    </div>
  );
}

function Step4({
  answers,
  setAnswer,
  questions,
  dimensions,
}: {
  answers: Record<string, string>;
  setAnswer: (id: string, v: string) => void;
  questions: ReturnType<typeof getGroupSurveyQuestions>;
  dimensions: ReturnType<typeof getGroupSurveyDimensions>;
}) {
  const answered = Object.keys(answers).length;
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold">Quiz-Profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Beantwortet die folgenden Aussagen aus Sicht eurer Gruppe. Je ehrlicher, desto besser
          das Matching.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {answered} / {questions.length} beantwortet
        </p>
      </div>

      {dimensions.map((dim) => {
        const dimQuestions = questions.filter((q) => q.dimensionId === dim.id);
        return (
          <div key={dim.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{dim.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{dim.label}</p>
                <p className="text-xs text-muted-foreground">{dim.description}</p>
              </div>
            </div>
            {dimQuestions.map((q) => (
              <div key={q.id} className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium mb-3">&ldquo;{q.text}&rdquo;</p>
                <div className="flex gap-1.5 flex-wrap">
                  {LIKERT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnswer(q.id, value)}
                      className={`flex-1 min-w-[56px] rounded-lg border py-2 text-xs font-medium transition-colors ${
                        answers[q.id] === value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {value}
                      <span className="hidden sm:block text-[10px] opacity-70 mt-0.5 leading-tight">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Step5({
  form,
  set,
  error,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Abschluss</h2>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-2">Logo nachreichen</p>
        <p>
          Ihr könnt euer Logo per E-Mail an{" "}
          <span className="font-medium text-foreground">fomo@stura.tu-dresden.de</span> schicken.
          Betreff: &ldquo;Logo – {form.name || "Gruppenname"}&rdquo;. Erlaubt sind PNG oder SVG,
          mindestens 200×200 px.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-2">Datenschutz & Nutzung</p>
        <p>
          Eure Daten werden ausschließlich für FOMO – das Hochschulgruppen-Matching der TU Dresden
          – verwendet. Stammdaten (Name, Beschreibung, Kontakt) werden öffentlich angezeigt.
          Antworten auf Quiz-Fragen fließen anonym in den Matching-Algorithmus ein. Ihr könnt eure
          Registrierung jederzeit widerrufen.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.dataConsent}
          onChange={(e) => set("dataConsent", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm">
          Ich stimme der Nutzung der Daten für FOMO zu und bestätige, dass ich berechtigt bin,
          diese Gruppe zu registrieren. *
        </span>
      </label>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Fehler: {error}
        </p>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
