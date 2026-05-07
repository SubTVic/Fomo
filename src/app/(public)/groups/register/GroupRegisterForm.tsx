// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import Link from "next/link";
import { STUDY2_ITEMS, STUDY2_FILTER } from "@/lib/study2/items";
import type { Study2AnswerValue } from "@/lib/study2/items";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1: Stammdaten
  name: string;
  categoryName: string;
  shortDescription: string;
  longDescription: string;
  foundedYear: string;
  motto: string;

  // Step 2: Kontakt & Präsenz
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

  // Step 4: WS2-Profil
  ws2Answers: Record<string, Study2AnswerValue>;
  ws2FilterSelections: string[];
  raterCount: 1 | 2 | 3;

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
  ws2Answers: Object.fromEntries(STUDY2_ITEMS.map((i) => [i.id, 0 as Study2AnswerValue])),
  ws2FilterSelections: [],
  raterCount: 1,
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

const STEPS = ["Stammdaten", "Kontakt & Präsenz", "Struktur", "Gruppencheck", "Abschluss"];

// ─── Component ───────────────────────────────────────────────────────────────

export function GroupRegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  // For step 4: track the current item index (including intro + filter screens)
  // quizScreen: "intro" | "filter" | number (item index 0-20)
  const [quizScreen, setQuizScreen] = useState<QuizScreen>("intro");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setWs2Answer(itemId: string, value: Study2AnswerValue) {
    setForm((prev) => ({
      ...prev,
      ws2Answers: { ...prev.ws2Answers, [itemId]: value },
    }));
  }

  function toggleFilter(attribute: string) {
    setForm((prev) => ({
      ...prev,
      ws2FilterSelections: prev.ws2FilterSelections.includes(attribute)
        ? prev.ws2FilterSelections.filter((f) => f !== attribute)
        : [...prev.ws2FilterSelections, attribute],
    }));
  }

  const [quizDone, setQuizDone] = useState(false);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const ws2Answers = STUDY2_ITEMS.map((item) => ({
        itemId: item.id,
        value: form.ws2Answers[item.id] ?? 0,
      }));

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
        ws2Answers,
        ws2FilterSelections: form.ws2FilterSelections,
        raterCount: form.raterCount,
        dataConsent: "ja" as const,
      };

      const res = await fetch("/api/groups/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitResult({ success: true });
      } else {
        const detail = data.details?.fieldErrors
          ? " (" + Object.entries(data.details.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; ") + ")"
          : "";
        setSubmitResult({ success: false, error: (data.error ?? "Unbekannter Fehler") + detail });
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="font-heading text-2xl uppercase">Registrierung erfolgreich!</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          Eure Gruppe wurde gespeichert und wird nach der Prüfung durch das FOMO-Team
          freigeschaltet. Wir melden uns per E-Mail.
        </p>
        <Link
          href="/groups"
          className="bg-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
        >
          Zur Gruppenübersicht
        </Link>
      </div>
    );
  }

  function canAdvance(): boolean {
    if (step === 1) {
      return (
        form.name.trim().length >= 2 &&
        form.categoryName !== "" &&
        form.shortDescription.trim().length >= 10 &&
        form.shortDescription.trim().length <= 200
      );
    }
    if (step === 2) return form.contactEmail.includes("@");
    if (step === 3) return true;
    if (step === 4) return quizDone;
    if (step === 5) return form.dataConsent;
    return false;
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[700px] border-4 border-foreground bg-card">
        {/* Progress header */}
        <div className="bg-foreground text-primary-foreground px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading text-sm uppercase">Gruppe registrieren</span>
            <span className="text-xs text-primary-foreground/60">
              Schritt {step} / {STEPS.length}
            </span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 transition-colors ${
                  i + 1 <= step ? "bg-primary-foreground" : "bg-primary-foreground/20"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-primary-foreground/60">{STEPS[step - 1]}</p>
        </div>

        <div className="px-6 py-8 sm:px-8">
          {step === 1 && <Step1 form={form} set={set} />}
          {step === 2 && <Step2 form={form} set={set} />}
          {step === 3 && <Step3 form={form} set={set} />}
          {step === 4 && (
            <Step4
              form={form}
              quizScreen={quizScreen}
              setQuizScreen={setQuizScreen}
              setWs2Answer={setWs2Answer}
              toggleFilter={toggleFilter}
              onDone={() => setQuizDone(true)}
              set={set}
            />
          )}
          {step === 5 && (
            <Step5 form={form} set={set} error={submitResult?.error} />
          )}

          {/* Navigation — only show outside the quiz item flow */}
          {(step !== 4 || quizDone) && (
            <div className="mt-10 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => {
                    if (step === 5) {
                      // going back to step 4 resets quiz completion so user can re-do
                      setQuizDone(false);
                      setQuizScreen("intro");
                    }
                    setStep((s) => s - 1);
                  }}
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
                  className="bg-foreground px-8 py-2.5 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors disabled:opacity-40"
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canAdvance()}
                  className="bg-foreground px-8 py-2.5 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors disabled:opacity-40"
                >
                  {isSubmitting ? "Wird gespeichert…" : "Absenden"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Stammdaten ───────────────────────────────────────────────────────

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
      <h2 className="font-heading text-lg uppercase">Stammdaten</h2>

      <Field label="Name der Gruppe *">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="z.B. Fachschaftsrat Informatik"
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </Field>

      <Field label="Kategorie *">
        <select
          value={form.categoryName}
          onChange={(e) => set("categoryName", e.target.value)}
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="">Bitte wählen…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
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
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
        />
      </Field>

      <Field label="Ausführliche Beschreibung">
        <textarea
          rows={5}
          value={form.longDescription}
          onChange={(e) => set("longDescription", e.target.value)}
          placeholder="Erzählt mehr über eure Geschichte, Ziele und Aktivitäten…"
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
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
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
        </Field>
        <Field label="Motto / Slogan">
          <input
            type="text"
            value={form.motto}
            onChange={(e) => set("motto", e.target.value)}
            placeholder="Optional"
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Step 2: Kontakt ──────────────────────────────────────────────────────────

function Step2({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-lg uppercase">Kontakt & Präsenz</h2>

      <Field label="E-Mail-Adresse *" hint="Für Rückfragen und die Bestätigungsmail">
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          placeholder="kontakt@meingruppe.de"
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ansprechperson">
          <input
            type="text"
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
            placeholder="Vor- und Nachname"
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
        </Field>
        <Field label="Rolle">
          <input
            type="text"
            value={form.contactPersonRole}
            onChange={(e) => set("contactPersonRole", e.target.value)}
            placeholder="z.B. Vorsitzende:r"
            className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
        </Field>
      </div>

      <Field label="Website">
        <input
          type="url"
          value={form.websiteUrl}
          onChange={(e) => set("websiteUrl", e.target.value)}
          placeholder="https://…"
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </Field>

      <Field label="Instagram">
        <input
          type="text"
          value={form.instagramUrl}
          onChange={(e) => set("instagramUrl", e.target.value)}
          placeholder="https://instagram.com/…"
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </Field>
    </div>
  );
}

// ─── Step 3: Struktur ─────────────────────────────────────────────────────────

function Step3({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-lg uppercase">Struktur</h2>

      <Field label="Mitgliederanzahl (ungefähr)">
        <div className="flex flex-wrap gap-2">
          {["1-10", "11-25", "26-50", "51-100", "100+"].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => set("memberCount", range)}
              className={`border-2 px-4 py-2 text-sm font-medium transition-colors ${
                form.memberCount === range
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-foreground/30 hover:border-foreground/60"
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
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
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
              className={`flex-1 border-2 px-3 py-2 text-sm font-medium transition-colors ${
                form.language === value
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-foreground/30 hover:border-foreground/60"
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
          className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
        />
      </Field>
    </div>
  );
}

// ─── Step 4: Gruppencheck (WS2-Items) ─────────────────────────────────────────

type QuizScreen = "intro" | "filter" | "rater" | number;

function Step4({
  form,
  quizScreen,
  setQuizScreen,
  setWs2Answer,
  toggleFilter,
  onDone,
  set,
}: {
  form: FormData;
  quizScreen: QuizScreen;
  setQuizScreen: (s: QuizScreen) => void;
  setWs2Answer: (itemId: string, value: Study2AnswerValue) => void;
  toggleFilter: (attribute: string) => void;
  onDone: () => void;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  const totalItems = STUDY2_ITEMS.length;

  // ── Intro ──
  if (quizScreen === "intro") {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="font-heading text-lg uppercase">Gruppencheck</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Beantwortet 21 kurze Aussagen aus Sicht eurer Gruppe. Das dauert ~3 Minuten und ist die
          Grundlage für das Matching.
        </p>
        <blockquote className="border-l-4 border-foreground pl-4 italic text-sm">
          &bdquo;Mitglieder unserer Gruppe würden dieser Aussage zustimmen.&ldquo;
        </blockquote>
        <button
          onClick={() => setQuizScreen("filter")}
          className="w-full bg-foreground py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
        >
          Jetzt starten
        </button>
      </div>
    );
  }

  // ── Filter ──
  if (quizScreen === "filter") {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg uppercase">Aktivitäten</h2>
        <p className="text-sm text-muted-foreground">
          Welche Aktivitäten stehen bei euch im Vordergrund?{" "}
          <span className="text-xs">(Mehrfachauswahl · nicht Pflicht)</span>
        </p>
        <div className="flex flex-col gap-2">
          {STUDY2_FILTER.options.map((opt) => {
            const isOn = form.ws2FilterSelections.includes(opt.attribute);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleFilter(opt.attribute)}
                className={`flex items-center gap-3 px-3 py-2.5 border-2 text-left text-sm transition-colors ${
                  isOn
                    ? "border-foreground bg-foreground/5 font-medium"
                    : "border-foreground/20 hover:border-foreground/50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 text-xs font-bold transition-colors ${
                    isOn
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : "border-foreground/30"
                  }`}
                >
                  {isOn ? "✓" : ""}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setQuizScreen(0)}
          className="w-full bg-foreground py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
        >
          Weiter zu den Fragen →
        </button>
      </div>
    );
  }

  // ── Rater screen (must come before item index cast) ──
  if (quizScreen === "rater") {
    const options: { label: string; value: 1 | 2 | 3 }[] = [
      { label: "Ich allein", value: 1 },
      { label: "Zu zweit", value: 2 },
      { label: "3 oder mehr Personen", value: 3 },
    ];
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg uppercase">Fast geschafft!</h2>
        <p className="text-sm text-muted-foreground">
          Wie viele Personen haben die Antworten gemeinsam erarbeitet?
        </p>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => set("raterCount", opt.value)}
            className={`w-full px-4 py-3 border-2 text-sm font-medium text-left transition-colors ${
              form.raterCount === opt.value
                ? "border-foreground bg-foreground text-primary-foreground"
                : "border-foreground/30 hover:border-foreground hover:bg-foreground/5"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={onDone}
          className="mt-2 w-full bg-foreground py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
        >
          Weiter zum Abschluss →
        </button>
        <button
          onClick={() => setQuizScreen(totalItems - 1)}
          className="text-xs text-center text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          ← Zurück
        </button>
      </div>
    );
  }

  // ── Item ──
  const itemIndex = quizScreen as number;
  const item = STUDY2_ITEMS[itemIndex];
  if (!item) return null; // guard against unexpected state

  const current = form.ws2Answers[item.id] ?? 0;
  const itemNum = itemIndex + 1;

  function handleAnswer(value: Study2AnswerValue) {
    setWs2Answer(item.id, value);
    if (itemIndex < totalItems - 1) {
      setTimeout(() => setQuizScreen(itemIndex + 1), 180);
    } else {
      setTimeout(() => setQuizScreen("rater"), 180);
    }
  }

  const answerBtns: { label: string; value: Study2AnswerValue }[] = [
    { label: "Stimme nicht zu", value: -1 },
    { label: "Neutral", value: 0 },
    { label: "Stimme zu", value: 1 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Frage {itemNum} von {totalItems}
        </span>
        <div className="h-1.5 w-32 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${Math.round((itemNum / totalItems) * 100)}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic">
        Mitglieder unserer Gruppe würden zustimmen:
      </p>
      <p className="font-heading text-base uppercase leading-snug">{item.text}</p>

      <div className="flex flex-col gap-2 mt-2">
        {answerBtns.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleAnswer(value)}
            className={`w-full px-4 py-3 border-2 text-sm font-medium text-left transition-colors ${
              current === value
                ? "border-foreground bg-foreground text-primary-foreground"
                : "border-foreground/30 hover:border-foreground hover:bg-foreground/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-1">
        <button
          onClick={() =>
            itemIndex === 0 ? setQuizScreen("filter") : setQuizScreen(itemIndex - 1)
          }
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          ← Zurück
        </button>
        <button
          onClick={() =>
            itemIndex < totalItems - 1
              ? setQuizScreen(itemIndex + 1)
              : setQuizScreen("rater")
          }
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Überspringen →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Abschluss ────────────────────────────────────────────────────────

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
      <h2 className="font-heading text-lg uppercase">Abschluss</h2>

      <div className="border-2 border-foreground/20 bg-accent p-4 text-sm text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-2">Logo nachreichen</p>
        <p>
          Ihr könnt euer Logo per E-Mail an{" "}
          <span className="font-medium text-foreground">victor.kling@yeti-dresden.org</span> schicken.
          Betreff: &ldquo;Logo – {form.name || "Gruppenname"}&rdquo;. Erlaubt sind PNG oder SVG,
          mindestens 200×200 px.
        </p>
      </div>

      <div className="border-2 border-foreground/20 bg-accent p-4 text-sm text-muted-foreground leading-relaxed">
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
          className="mt-0.5 h-4 w-4 border-border accent-primary"
        />
        <span className="text-sm">
          Ich stimme der Nutzung der Daten für FOMO zu und bestätige, dass ich berechtigt bin,
          diese Gruppe zu registrieren.{" "}
          <span className="text-muted-foreground">*</span>
        </span>
      </label>
      <p className="text-xs text-muted-foreground">
        * Pflichtfeld. Die Informationen zu Datenschutz und Nutzung stehen oben.
      </p>

      {error && (
        <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Fehler: {error}
        </p>
      )}
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

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
