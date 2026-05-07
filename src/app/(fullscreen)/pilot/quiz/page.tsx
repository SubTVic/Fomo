// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STUDY2_ITEMS, STUDY2_FILTER, type Study2AnswerValue } from "@/lib/study2/items";

type GroupOption = { id: string; name: string };
type Step =
  | "group"
  | "filter"
  | { kind: "item"; index: number }
  | "demographics"
  | "feedback"
  | "submitting"
  | "done"
  | "error";

const SEMESTER_OPTIONS = ["1", "2", "3", "4", "5", "6+"] as const;

export default function Study2QuizPage() {
  const [step, setStep] = useState<Step>("group");
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupNameFreeText, setGroupNameFreeText] = useState("");
  const [noGroup, setNoGroup] = useState(false);
  const [filterSelections, setFilterSelections] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, Study2AnswerValue>>({});
  const [semester, setSemester] = useState<(typeof SEMESTER_OPTIONS)[number] | "">("");
  const [studyField, setStudyField] = useState("");
  const [feedbackConfusing, setFeedbackConfusing] = useState("");
  const [feedbackMissing, setFeedbackMissing] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study2/groups")
      .then((res) => res.json())
      .then((data) => setGroups(data.groups ?? []))
      .catch(() => setGroups([]));
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups.slice(0, 50);
    const q = groupSearch.trim().toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 50);
  }, [groups, groupSearch]);

  const totalItems = STUDY2_ITEMS.length;

  function goToItem(index: number) {
    if (index >= totalItems) {
      setStep("demographics");
    } else {
      setStep({ kind: "item", index });
    }
  }

  async function submit() {
    setStep("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/study2/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: groupId,
          groupNameFreeText: groupNameFreeText.trim() ? groupNameFreeText.trim() : null,
          filterSelections,
          semester: semester || null,
          studyField: studyField.trim() ? studyField.trim() : null,
          feedbackConfusing: feedbackConfusing.trim() ? feedbackConfusing.trim() : null,
          feedbackMissing: feedbackMissing.trim() ? feedbackMissing.trim() : null,
          answers: STUDY2_ITEMS.filter((it) => answers[it.id] !== undefined).map((it) => ({
            itemId: it.id,
            value: answers[it.id],
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error ?? "Fehler beim Senden.");
        setStep("error");
        return;
      }
      setStep("done");
    } catch {
      setErrorMessage("Netzwerkfehler. Bitte später erneut versuchen.");
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-[700px] border-4 border-foreground bg-card flex flex-col">
        {step === "group" && (
          <GroupStep
            groups={filteredGroups}
            search={groupSearch}
            onSearch={setGroupSearch}
            groupId={groupId}
            onPickGroup={(id) => { setGroupId(id); setNoGroup(false); }}
            freeText={groupNameFreeText}
            onFreeText={(s) => { setGroupNameFreeText(s); setNoGroup(false); }}
            noGroup={noGroup}
            onNoGroup={() => { setNoGroup(true); setGroupId(null); setGroupNameFreeText(""); }}
            canContinue={Boolean(groupId) || groupNameFreeText.trim().length > 0 || noGroup}
            onNext={() => setStep("filter")}
          />
        )}

        {step === "filter" && (
          <FilterStep
            selections={filterSelections}
            onToggle={(id) =>
              setFilterSelections((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
            onBack={() => setStep("group")}
            onNext={() => goToItem(0)}
          />
        )}

        {typeof step === "object" && step.kind === "item" && (
          <ItemStep
            index={step.index}
            total={totalItems}
            onBack={() => {
              if (step.index === 0) setStep("filter");
              else goToItem(step.index - 1);
            }}
            current={answers[STUDY2_ITEMS[step.index].id]}
            onAnswer={(value) => {
              const id = STUDY2_ITEMS[step.index].id;
              setAnswers((prev) => ({ ...prev, [id]: value }));
              goToItem(step.index + 1);
            }}
          />
        )}

        {step === "demographics" && (
          <DemographicsStep
            semester={semester}
            onSemester={setSemester}
            studyField={studyField}
            onStudyField={setStudyField}
            onBack={() => goToItem(totalItems - 1)}
            onNext={() => setStep("feedback")}
          />
        )}

        {step === "feedback" && (
          <FeedbackStep
            confusing={feedbackConfusing}
            onConfusing={setFeedbackConfusing}
            missing={feedbackMissing}
            onMissing={setFeedbackMissing}
            onBack={() => setStep("demographics")}
            onSubmit={submit}
          />
        )}

        {step === "submitting" && (
          <PaddedBlock>
            <p className="text-center text-sm text-muted-foreground">Sende Antworten…</p>
          </PaddedBlock>
        )}

        {step === "done" && (
          <PaddedBlock>
            <h2 className="font-heading text-xl uppercase mb-3">Danke!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Deine Antworten sind gespeichert. Sobald die Auswertung fertig ist (Mai/Juni
              2026), zeigen wir dir auf der Homepage, was dabei rausgekommen ist.
            </p>
            <Link
              href="/"
              className="inline-block bg-foreground text-primary-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
            >
              Zurück zur Startseite
            </Link>
          </PaddedBlock>
        )}

        {step === "error" && (
          <PaddedBlock>
            <h2 className="font-heading text-xl uppercase mb-3">Da ging was schief</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {errorMessage ?? "Unbekannter Fehler."}
            </p>
            <button
              type="button"
              onClick={submit}
              className="bg-foreground text-primary-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
            >
              Erneut senden
            </button>
          </PaddedBlock>
        )}
      </div>
    </div>
  );
}

function PaddedBlock({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-8 sm:px-8 sm:py-10">{children}</div>;
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
      <h2 className="font-heading text-lg sm:text-xl uppercase leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-[11px] mt-1 text-primary-foreground/60">{subtitle}</p>
      )}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextLabel = "Weiter",
  nextDisabled = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="border-t-4 border-foreground px-6 py-4 sm:px-8 flex justify-between items-center gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← Zurück
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="bg-foreground text-primary-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

function GroupStep(props: {
  groups: GroupOption[];
  search: string;
  onSearch: (s: string) => void;
  groupId: string | null;
  onPickGroup: (id: string | null) => void;
  freeText: string;
  onFreeText: (s: string) => void;
  noGroup: boolean;
  onNoGroup: () => void;
  canContinue: boolean;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeader title="Welche Gruppe?" subtitle="Schritt 1 von 5" />
      <PaddedBlock>
        <p className="text-sm text-muted-foreground mb-4">
          Wähle die Hochschulgruppe, in der du Mitglied bist. Du kannst nach dem Namen
          suchen.
        </p>
        <input
          type="text"
          value={props.search}
          onChange={(e) => props.onSearch(e.target.value)}
          placeholder="Gruppe suchen…"
          className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm mb-3"
        />
        <div className="max-h-64 overflow-y-auto border-2 border-foreground mb-4">
          {props.groups.length === 0 && (
            <p className="text-xs text-muted-foreground p-3">Keine Treffer.</p>
          )}
          {props.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                props.onPickGroup(g.id);
                props.onFreeText("");
              }}
              className={`block w-full text-left px-3 py-2 text-sm border-b border-foreground/20 last:border-b-0 ${
                props.groupId === g.id
                  ? "bg-foreground text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="border-t-2 border-foreground/30 pt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Gruppe nicht dabei? Tippe ihren Namen:
          </p>
          <input
            type="text"
            value={props.freeText}
            onChange={(e) => {
              props.onFreeText(e.target.value);
              if (e.target.value) props.onPickGroup(null);
            }}
            placeholder="Name der Gruppe"
            maxLength={200}
            className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="border-t-2 border-foreground/30 pt-4 mt-4">
          <button
            type="button"
            onClick={props.onNoGroup}
            className={`w-full border-2 border-dashed border-foreground px-4 py-3 text-sm transition-colors ${
              props.noGroup
                ? "bg-foreground text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Ich bin in keiner Gruppe
          </button>
        </div>
      </PaddedBlock>
      <NavRow onNext={props.onNext} nextDisabled={!props.canContinue} />
    </>
  );
}

function FilterStep(props: {
  selections: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeader title={STUDY2_FILTER.question} subtitle="Schritt 2 von 5" />
      <PaddedBlock>
        <p className="text-sm text-muted-foreground mb-4">{STUDY2_FILTER.subtitle}</p>
        <div className="grid gap-2">
          {STUDY2_FILTER.options.map((opt) => {
            const active = props.selections.includes(opt.attribute);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => props.onToggle(opt.attribute)}
                className={`text-left border-2 border-foreground px-4 py-3 text-sm transition-colors ${
                  active
                    ? "bg-foreground text-primary-foreground"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </PaddedBlock>
      <NavRow onBack={props.onBack} onNext={props.onNext} />
    </>
  );
}

function ItemStep(props: {
  index: number;
  total: number;
  current: Study2AnswerValue | undefined;
  onAnswer: (value: Study2AnswerValue) => void;
  onBack: () => void;
}) {
  const item = STUDY2_ITEMS[props.index];
  const progress = ((props.index + 1) / props.total) * 100;

  return (
    <>
      <div className="bg-foreground text-primary-foreground px-6 py-4 sm:px-8">
        <p className="text-[11px] uppercase tracking-[3px] text-primary-foreground/60 mb-2">
          Frage {props.index + 1} von {props.total}
        </p>
        <div className="h-1 bg-primary-foreground/20">
          <div
            className="h-full bg-primary-foreground transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <PaddedBlock>
        <p className="font-heading text-xl sm:text-2xl uppercase leading-tight mb-8">
          {item.text}
        </p>
        <div className="grid gap-3">
          {(
            [
              { value: 1 as const, label: "Stimme zu" },
              { value: 0 as const, label: "Neutral" },
              { value: -1 as const, label: "Stimme nicht zu" },
            ] satisfies Array<{ value: Study2AnswerValue; label: string }>
          ).map((opt) => {
            const active = props.current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => props.onAnswer(opt.value)}
                className={`border-4 border-foreground px-4 py-5 font-heading text-base uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-foreground text-primary-foreground"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </PaddedBlock>
      <NavRow onBack={props.onBack} />
    </>
  );
}

function DemographicsStep(props: {
  semester: (typeof SEMESTER_OPTIONS)[number] | "";
  onSemester: (s: (typeof SEMESTER_OPTIONS)[number] | "") => void;
  studyField: string;
  onStudyField: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeader title="Kurz zu dir" subtitle="Schritt 4 von 5" />
      <PaddedBlock>
        <label className="block text-sm font-semibold uppercase tracking-wide mb-2">
          Semester
        </label>
        <select
          value={props.semester}
          onChange={(e) =>
            props.onSemester(e.target.value as (typeof SEMESTER_OPTIONS)[number] | "")
          }
          className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm mb-5"
        >
          <option value="">— wählen —</option>
          {SEMESTER_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="block text-sm font-semibold uppercase tracking-wide mb-2">
          Studiengang (optional)
        </label>
        <input
          type="text"
          value={props.studyField}
          onChange={(e) => props.onStudyField(e.target.value)}
          maxLength={100}
          placeholder="z.B. Informatik B.Sc."
          className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm"
        />
      </PaddedBlock>
      <NavRow onBack={props.onBack} onNext={props.onNext} />
    </>
  );
}

function FeedbackStep(props: {
  confusing: string;
  onConfusing: (s: string) => void;
  missing: string;
  onMissing: (s: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <StepHeader title="Letzte Frage" subtitle="Schritt 5 von 5 (optional)" />
      <PaddedBlock>
        <label className="block text-sm font-semibold uppercase tracking-wide mb-2">
          Was war verwirrend?
        </label>
        <textarea
          value={props.confusing}
          onChange={(e) => props.onConfusing(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm mb-5"
        />
        <label className="block text-sm font-semibold uppercase tracking-wide mb-2">
          Was hat gefehlt?
        </label>
        <textarea
          value={props.missing}
          onChange={(e) => props.onMissing(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm"
        />
      </PaddedBlock>
      <NavRow onBack={props.onBack} onNext={props.onSubmit} nextLabel="Antworten senden" />
    </>
  );
}
