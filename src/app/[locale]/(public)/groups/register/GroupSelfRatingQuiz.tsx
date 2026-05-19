// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { STUDY2_ITEMS, STUDY2_FILTER } from "@/lib/study2/items";
import type { Study2AnswerValue } from "@/lib/study2/items";

type Step =
  | { type: "intro" }
  | { type: "filter" }
  | { type: "item"; index: number }
  | { type: "description" }
  | { type: "raterCount" };

interface Category {
  id: string;
  name: string;
}

interface GroupData {
  id: string;
  name: string;
  shortDescription: string;
  websiteUrl: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  memberCount: number | null;
  foundedYear: number | null;
  categoryId: string;
  category: Category;
  selfRating?: {
    raterCount: number;
    filterSelections: string[];
    answers: Array<{ itemId: string; value: number }>;
  } | null;
}

// ─── Progress bar ──────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-1.5 bg-foreground/10">
      <div
        className="h-full bg-foreground transition-all duration-300"
        style={{ width: `${Math.round((current / total) * 100)}%` }}
      />
    </div>
  );
}

// ─── Answer button ─────────────────────────────────────────────────────────

function AnswerButton({
  label,
  value,
  current,
  onClick,
}: {
  label: string;
  value: Study2AnswerValue;
  current: Study2AnswerValue;
  onClick: (v: Study2AnswerValue) => void;
}) {
  const isSelected = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-full px-4 py-3.5 border-2 text-sm font-medium text-left transition-colors ${
        isSelected
          ? "border-foreground bg-foreground text-primary-foreground"
          : "border-foreground/30 hover:border-foreground hover:bg-foreground/5"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function GroupSelfRatingQuiz() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("selfrating");
  const tCommon = useTranslations("common");

  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "ready">("loading");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState("");
  const [group, setGroup] = useState<GroupData | null>(null);
  const [step, setStep] = useState<Step>({ type: "intro" });
  const [answers, setAnswers] = useState<Record<string, Study2AnswerValue>>({});
  const [filterSelections, setFilterSelections] = useState<string[]>([]);
  const [raterCount, setRaterCount] = useState<1 | 2 | 3>(1);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const noTokenMsg = t("noToken");
  const unknownErrorMsg = t("unknownError");
  const networkErrorMsg = tCommon("networkError");

  useEffect(() => {
    if (!token) {
      setLoadStatus("error");
      setError(noTokenMsg);
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/groups/register-attributes?token=${encodeURIComponent(token!)}`);
        const data = await res.json();
        if (!res.ok) {
          setLoadStatus("error");
          setError(data.error ?? unknownErrorMsg);
          return;
        }
        const g = data.group as GroupData;
        setGroup(g);
        setDescription(g.shortDescription);
        setWebsite(g.websiteUrl ?? "");
        setContactEmail(g.contactEmail ?? "");
        setInstagramUrl(g.instagramUrl ?? "");
        setMemberCount(g.memberCount ? String(g.memberCount) : "");
        setFoundedYear(g.foundedYear ? String(g.foundedYear) : "");
        setCategoryId(g.categoryId);
        setCategories(data.categories ?? []);

        // Pre-fill from previous selfRating if it exists
        if (g.selfRating?.answers?.length) {
          const prev: Record<string, Study2AnswerValue> = {};
          for (const a of g.selfRating.answers) {
            prev[a.itemId] = a.value as Study2AnswerValue;
          }
          setAnswers(prev);
          setFilterSelections(
            Array.isArray(g.selfRating.filterSelections) ? g.selfRating.filterSelections : []
          );
          setRaterCount((g.selfRating.raterCount as 1 | 2 | 3) ?? 1);
        } else {
          // Initialize all items to 0 (neutral)
          const init: Record<string, Study2AnswerValue> = {};
          for (const item of STUDY2_ITEMS) {
            init[item.id] = 0;
          }
          setAnswers(init);
        }

        setLoadStatus("ready");
      } catch {
        setLoadStatus("error");
        setError(networkErrorMsg);
      }
    }

    load();
  }, [token, noTokenMsg, unknownErrorMsg, networkErrorMsg]);

  const toggleFilter = useCallback((filterId: string) => {
    setFilterSelections((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  }, []);

  const setAnswer = useCallback((itemId: string, value: Study2AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    // Auto-advance to next item
    const idx = STUDY2_ITEMS.findIndex((i) => i.id === itemId);
    if (idx < STUDY2_ITEMS.length - 1) {
      setTimeout(() => setStep({ type: "item", index: idx + 1 }), 180);
    } else {
      setTimeout(() => setStep({ type: "description" }), 180);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!token) return;
    setSubmitStatus("submitting");

    const ws2Answers = STUDY2_ITEMS.map((item) => ({
      itemId: item.id,
      value: answers[item.id] ?? 0,
    }));

    try {
      const res = await fetch("/api/groups/register-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ws2Answers,
          ws2FilterSelections: filterSelections,
          raterCount,
          shortDescription: description.trim(),
          websiteUrl: website.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          memberCount: memberCount ? parseInt(memberCount, 10) : undefined,
          foundedYear: foundedYear ? parseInt(foundedYear, 10) : undefined,
          categoryId: categoryId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitStatus("done");
      } else {
        setSubmitStatus("idle");
        setError(data.error ?? unknownErrorMsg);
      }
    } catch {
      setSubmitStatus("idle");
      setError(networkErrorMsg);
    }
  }, [token, answers, filterSelections, raterCount, description, website, unknownErrorMsg, networkErrorMsg]);

  // ── Error ──
  if (loadStatus === "error") {
    return (
      <div className="flex flex-col items-center px-4 py-20 text-center">
        <div className="w-full max-w-[520px] border-4 border-foreground bg-card px-6 py-10 sm:px-8">
          <h1 className="font-heading text-xl uppercase mb-4">{tCommon("error")}</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {tCommon("home")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loadStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  // ── Done ──
  if (submitStatus === "done") {
    return (
      <div className="flex flex-col items-center px-4 py-20 text-center">
        <div className="w-full max-w-[520px] border-4 border-foreground bg-card px-6 py-10 sm:px-8">
          <h1 className="font-heading text-xl uppercase mb-4">{t("done.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("done.text")}
          </p>
          <Link
            href="/groups"
            className="mt-6 inline-block bg-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
          >
            {t("done.allGroupsButton")}
          </Link>
        </div>
      </div>
    );
  }

  const totalSteps = 2 + STUDY2_ITEMS.length + 2; // filter + items + description + raterCount (intro not counted)

  function currentStepIndex(): number {
    if (step.type === "filter") return 1;
    if (step.type === "item") return 2 + step.index;
    if (step.type === "description") return 2 + STUDY2_ITEMS.length;
    if (step.type === "raterCount") return 2 + STUDY2_ITEMS.length + 1;
    return 0;
  }

  // ── Intro ──
  if (step.type === "intro") {
    return (
      <div className="flex flex-col items-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[560px] border-4 border-foreground bg-card">
          <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
            <h1 className="font-heading text-xl uppercase">{t("title")}</h1>
            <p className="mt-1 text-sm text-primary-foreground/60">{group?.name}</p>
          </div>
          <div className="px-6 py-8 sm:px-8 flex flex-col gap-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("intro.text")}
            </p>
            <blockquote className="border-l-4 border-foreground pl-4 italic text-sm">
              {t("intro.quote")}
            </blockquote>
            <p className="text-sm text-muted-foreground">
              {t("intro.duration")}
            </p>
            <button
              onClick={() => setStep({ type: "filter" })}
              className="w-full bg-foreground py-4 font-heading text-base uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
            >
              {t("intro.startButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Filter ──
  if (step.type === "filter") {
    return (
      <div className="flex flex-col items-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[560px] border-4 border-foreground bg-card">
          <ProgressBar current={currentStepIndex()} total={totalSteps} />
          <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
            <p className="text-xs uppercase tracking-wider text-primary-foreground/50 mb-1">
              {t("filter.label")}
            </p>
            <h2 className="font-heading text-lg uppercase leading-snug">
              {t("filter.title")}
            </h2>
            <p className="mt-1 text-xs text-primary-foreground/50">{t("filter.multi")}</p>
          </div>
          <div className="px-6 py-6 sm:px-8 flex flex-col gap-2">
            {STUDY2_FILTER.options.map((opt) => {
              const isOn = filterSelections.includes(opt.attribute);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleFilter(opt.attribute)}
                  className={`flex items-center gap-3 px-3 py-3 border-2 text-left text-sm transition-colors ${
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
            <button
              onClick={() => setStep({ type: "item", index: 0 })}
              className="mt-4 w-full bg-foreground py-4 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
            >
              {t("filter.continueButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Item ──
  if (step.type === "item") {
    const item = STUDY2_ITEMS[step.index];
    const current = answers[item.id] ?? 0;
    const itemNum = step.index + 1;

    return (
      <div className="flex flex-col items-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[560px] border-4 border-foreground bg-card">
          <ProgressBar current={currentStepIndex()} total={totalSteps} />
          <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
            <p className="text-xs uppercase tracking-wider text-primary-foreground/50 mb-1">
              {t("item.questionOf", { current: itemNum, total: STUDY2_ITEMS.length })}
            </p>
            <p className="text-xs text-primary-foreground/60 mb-2 italic">
              {t("item.memberWouldAgree")}
            </p>
            <h2 className="font-heading text-lg uppercase leading-snug">{item.text}</h2>
          </div>
          <div className="px-6 py-6 sm:px-8 flex flex-col gap-2">
            <AnswerButton label={t("item.agree")} value={1} current={current} onClick={(v) => setAnswer(item.id, v)} />
            <AnswerButton label={t("item.neutral")} value={0} current={current} onClick={(v) => setAnswer(item.id, v)} />
            <AnswerButton label={t("item.disagree")} value={-1} current={current} onClick={(v) => setAnswer(item.id, v)} />
            <div className="flex justify-between pt-2">
              <button
                onClick={() =>
                  step.index === 0
                    ? setStep({ type: "filter" })
                    : setStep({ type: "item", index: step.index - 1 })
                }
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {tCommon("back")}
              </button>
              <button
                onClick={() =>
                  step.index < STUDY2_ITEMS.length - 1
                    ? setStep({ type: "item", index: step.index + 1 })
                    : setStep({ type: "description" })
                }
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {tCommon("skip")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Description / Website ──
  if (step.type === "description") {
    return (
      <div className="flex flex-col items-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[560px] border-4 border-foreground bg-card">
          <ProgressBar current={currentStepIndex()} total={totalSteps} />
          <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
            <h2 className="font-heading text-xl uppercase">{t("description.title")}</h2>
            <p className="mt-1 text-xs text-primary-foreground/50">{group?.name}</p>
          </div>
          <div className="px-6 py-6 sm:px-8 flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              {t("description.text")}
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("description.category")}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("description.shortDesc")}{" "}
                <span className="text-muted-foreground font-normal">{t("description.shortDescRequired")}</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                placeholder={t("description.shortDescPlaceholder")}
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              />
              <span className="text-xs text-muted-foreground">
                {t("description.shortDescChars", { count: description.trim().length })}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("description.contactEmail")}</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="kontakt@beispiel.de"
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("description.website")}</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("description.instagram")}</label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/euregruppe"
                className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t("description.memberCount")}</label>
                <input
                  type="number"
                  value={memberCount}
                  onChange={(e) => setMemberCount(e.target.value)}
                  placeholder="z.B. 25"
                  min={1}
                  max={10000}
                  className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t("description.foundedYear")}</label>
                <input
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="z.B. 2010"
                  min={1900}
                  max={new Date().getFullYear()}
                  className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <button
              onClick={() => setStep({ type: "raterCount" })}
              className="w-full bg-foreground py-4 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
            >
              {t("description.continueButton")}
            </button>
            <button
              onClick={() => setStep({ type: "item", index: STUDY2_ITEMS.length - 1 })}
              className="text-xs text-center text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {t("description.backButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Rater count ──
  if (step.type === "raterCount") {
    const options: { label: string; value: 1 | 2 | 3 }[] = [
      { label: t("raterCount.alone"), value: 1 },
      { label: t("raterCount.two"), value: 2 },
      { label: t("raterCount.threeOrMore"), value: 3 },
    ];

    return (
      <div className="flex flex-col items-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[560px] border-4 border-foreground bg-card">
          <ProgressBar current={currentStepIndex()} total={totalSteps} />
          <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
            <h2 className="font-heading text-xl uppercase leading-snug">
              {t("raterCount.question")}
            </h2>
          </div>
          <div className="px-6 py-6 sm:px-8 flex flex-col gap-3">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRaterCount(opt.value)}
                className={`w-full px-4 py-3.5 border-2 text-sm font-medium text-left transition-colors ${
                  raterCount === opt.value
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-foreground/30 hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {opt.label}
              </button>
            ))}

            {error && (
              <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitStatus === "submitting"}
              className="mt-2 w-full bg-foreground py-4 font-heading text-base uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors disabled:opacity-40"
            >
              {submitStatus === "submitting" ? t("raterCount.submitting") : t("raterCount.submitButton")}
            </button>
            <button
              onClick={() => setStep({ type: "description" })}
              className="text-xs text-center text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {tCommon("back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
