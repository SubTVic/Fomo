// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Group, MatchResult, QuizFilters } from "@/lib/types";
import { groupCategory, groupShortText } from "@/lib/group-copy";
import { track, EVENTS } from "@/lib/analytics";
import { ShareButton } from "./ShareButton";
import { CompareGroups } from "./CompareGroups";

interface ResultsScreenProps {
  matches: MatchResult[];
  answeredCount: number;
  itemCount: number;
  filters: QuizFilters;
  resultsParam: string;
  onRestart: () => void;
  lang?: "de" | "en";
}

const INITIAL_RESULTS = 5;

export function ResultsScreen({
  matches,
  itemCount,
  filters,
  resultsParam,
  onRestart,
  lang = "de",
}: ResultsScreenProps) {
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<"groups" | "compare">("groups");
  const allMatches = matches.filter((m) => m.score > 0);
  const visibleMatches = showAll ? allMatches : allMatches.slice(0, INITIAL_RESULTS);

  const ranked = visibleMatches.map((m) => {
    const firstSameScoreIndex = allMatches.findIndex((candidate) => candidate.score === m.score);
    return {
      ...m,
      rank: firstSameScoreIndex + 1,
    };
  });

  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    setRevealed(0);
  }, [showAll, tab]);

  useEffect(() => {
    if (tab !== "groups" || revealed >= ranked.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 80);
    return () => clearTimeout(t);
  }, [revealed, ranked.length, tab]);

  // Zero-hit rate: too-strict filters or unclear answers produce no result at
  // all — the single most actionable signal for tuning filters/items.
  useEffect(() => {
    if (allMatches.length === 0) track(EVENTS.resultsZeroHits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatches.length === 0]);

  function selectTab(next: "groups" | "compare") {
    track(EVENTS.resultsTab, { tab: next });
    setTab(next);
  }

  function toggleShowAll() {
    const next = !showAll;
    track(EVENTS.resultsShowMore, { expanded: next });
    setShowAll(next);
  }

  const copy =
    lang === "en"
      ? {
          title: "Your result",
          subtitle: "These student groups match your answers:",
          how: (n: number) =>
            `Every group answered the same ${n} questions as you — the score shows how closely your answers agree.`,
          groups: "Groups",
          compare: "Compare",
          none: "No clear matches. Try fewer filters or clearer answers.",
          more: (count: number) => `Show ${count} more`,
          less: "Show fewer",
          again: "Start over",
          allGroups: "All groups",
        }
      : {
          title: "Dein Ergebnis",
          subtitle: "Diese Hochschulgruppen passen zu deinen Antworten:",
          how: (n: number) =>
            `Jede Gruppe hat dieselben ${n} Fragen beantwortet wie du — der Prozentwert zeigt, wie stark eure Antworten übereinstimmen.`,
          groups: "Gruppen",
          compare: "Vergleichen",
          none: "Keine eindeutigen Treffer. Probier es mit weniger Filtern oder klareren Antworten.",
          more: (count: number) => `Weitere ${count} anzeigen`,
          less: "Weniger anzeigen",
          again: "Von vorne beginnen",
          allGroups: "Alle Gruppen",
        };
  const prefix = lang === "en" ? "/en" : "";

  return (
    <div className="animate-fade-up">
      <div>
        <h1 className="text-3xl text-navy sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 text-body">{copy.subtitle}</p>
        <p className="mt-1 text-sm text-muted">{copy.how(itemCount)}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => selectTab("groups")}
          className={`border-poster px-6 py-3 font-heading transition-colors ${
            tab === "groups" ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
          }`}
        >
          {copy.groups}
        </button>
        <button
          type="button"
          onClick={() => selectTab("compare")}
          className={`border-poster px-6 py-3 font-heading transition-colors ${
            tab === "compare" ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
          }`}
        >
          {copy.compare}
        </button>
      </div>

      {tab === "groups" ? (
        <div className="mt-5">
          {ranked.length === 0 ? (
            <div className="border-poster bg-card p-6 text-center">
              <p className="text-body">{copy.none}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#d8dde1] overflow-hidden border-poster bg-card">
              {ranked.map((m, i) => (
                <div key={m.group.id} className={i < revealed ? "animate-fade-up" : "invisible"}>
                  <ResultRow
                    group={m.group}
                    score={m.score}
                    rank={m.rank}
                    resultsParam={resultsParam}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          )}

          {allMatches.length > INITIAL_RESULTS && (
            <button
              type="button"
              onClick={toggleShowAll}
              className="mt-5 w-full border-poster bg-card px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-surface"
            >
              {showAll ? copy.less : copy.more(allMatches.length - INITIAL_RESULTS)}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5">
          {allMatches.length >= 2 ? (
            <CompareGroups results={allMatches.slice(0, 10)} filters={filters} lang={lang} />
          ) : (
            <div className="border-poster bg-card p-6 text-center">
              <p className="text-body">{copy.none}</p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="mt-6 w-full border-poster bg-surface px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-card"
      >
        {copy.again}
      </button>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ShareButton />
        <Link
          href={`${prefix}/groups`}
          className="border-poster bg-navy px-6 py-3 text-center font-heading text-sky transition-colors hover:bg-navy-hover"
        >
          {copy.allGroups}
        </Link>
      </div>

      <ResultsFeedback lang={lang} />
    </div>
  );
}

/**
 * One-tap satisfaction signal ("War das hilfreich?"). Anonymous, no follow-up
 * question — a rough but honest quality metric without a survey.
 */
function ResultsFeedback({ lang }: { lang: "de" | "en" }) {
  const [given, setGiven] = useState<"up" | "down" | null>(null);

  function give(value: "up" | "down") {
    if (given) return;
    track(EVENTS.resultsFeedback, { value });
    setGiven(value);
  }

  return (
    <div className="mt-8 border-2 border-navy bg-surface p-4 text-center">
      {given ? (
        <p className="text-sm font-semibold text-navy">
          {lang === "en" ? "Thanks for the feedback!" : "Danke für dein Feedback!"}
        </p>
      ) : (
        <>
          <p className="text-sm text-body">
            {lang === "en" ? "Was this helpful?" : "War das hilfreich?"}
          </p>
          <div className="mt-3 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => give("up")}
              aria-label={lang === "en" ? "Yes, helpful" : "Ja, hilfreich"}
              className="border-2 border-navy px-5 py-2 text-xl transition-colors hover:bg-card"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => give("down")}
              aria-label={lang === "en" ? "Not helpful" : "Nicht hilfreich"}
              className="border-2 border-navy px-5 py-2 text-xl transition-colors hover:bg-card"
            >
              👎
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ResultRow({
  group,
  score,
  rank,
  resultsParam,
  lang,
}: {
  group: Group;
  score: number;
  rank: number;
  resultsParam: string;
  lang: "de" | "en";
}) {
  const color = score >= 70 ? "#10c463" : score >= 50 ? "#f2c94c" : "#d64545";
  const prefix = lang === "en" ? "/en" : "";
  const detailHref = `${prefix}/groups/${group.slug}/${resultsParam ? `?r=${encodeURIComponent(resultsParam)}` : ""}`;
  const links = buildLinks(group, lang);

  return (
    <details className="group/result p-4 sm:p-5">
      <summary className="grid cursor-pointer grid-cols-[40px_1fr_36px] items-start gap-3 marker:content-none">
        <RankBadge rank={rank} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="min-w-0 truncate font-heading text-base text-navy sm:text-lg">
              {group.name}
            </h2>
            <span className="text-sm font-semibold text-accent-muted">{groupCategory(group, lang)}</span>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="h-3 overflow-hidden bg-surface">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
            <span className="font-heading text-sm text-navy">{score}%</span>
          </div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center font-heading text-3xl leading-none text-accent-muted transition-transform group-open/result:rotate-180">
          ▾
        </span>
      </summary>

      <div className="grid grid-rows-[0fr] transition-all duration-300 ease-out group-open/result:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="mt-4 pl-[52px]">
            <p className="max-w-[680px] text-base leading-relaxed text-body">
              {groupShortText(group, lang)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  onClick={() =>
                    track(EVENTS.groupClick, {
                      group: group.slug,
                      dest: link.dest,
                      context: "results",
                      rank,
                    })
                  }
                  className={`border-2 border-navy px-4 py-2 font-semibold transition-colors ${
                    link.primary
                      ? "bg-navy text-sky hover:bg-navy-hover"
                      : "bg-card text-navy hover:bg-surface"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href={detailHref}
                onClick={() => track(EVENTS.groupDetailOpen, { group: group.slug, context: "results", rank })}
                className="border-2 border-navy bg-card px-4 py-2 font-semibold text-navy transition-colors hover:bg-surface"
              >
                {lang === "en" ? "Open profile" : "Profil öffnen"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = ["#ffd34d", "#d8c6ff", "#f2a15f"];
    return (
      <span
        className="flex h-8 w-8 items-center justify-center border-2 border-navy font-heading text-xs text-navy"
        style={{ backgroundColor: colors[rank - 1] }}
      >
        {rank}
      </span>
    );
  }

  return <span className="pt-1 font-heading text-sm text-accent-muted">#{rank}</span>;
}

function buildLinks(group: Group, lang: "de" | "en") {
  const links: Array<{ href: string; label: string; external: boolean; primary?: boolean; dest: string }> = [];
  if (group.contactEmail) {
    links.push({
      href: `mailto:${group.contactEmail}`,
      label: lang === "en" ? "Write e-mail" : "E-Mail schreiben",
      external: false,
      primary: true,
      dest: "email",
    });
  }
  if (group.websiteUrl)
    links.push({ href: group.websiteUrl, label: "Website", external: true, dest: "website" });
  if (group.instagramUrl)
    links.push({ href: group.instagramUrl, label: "Instagram", external: true, dest: "instagram" });
  return links;
}
