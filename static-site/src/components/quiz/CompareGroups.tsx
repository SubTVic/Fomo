// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Group, QuizFilters } from "@/lib/types";
import { GroupLogo } from "@/components/GroupLogo";

interface CompareGroupsProps {
  results: Array<{ group: Group; score: number }>;
  filters: QuizFilters;
  lang?: "de" | "en";
}

export function CompareGroups({ results, filters, lang = "de" }: CompareGroupsProps) {
  const [aId, setAId] = useState(results[0].group.id);
  const [bId, setBId] = useState(results[1].group.id);

  const a = results.find((r) => r.group.id === aId) ?? results[0];
  const b = results.find((r) => r.group.id === bId) ?? results[1];
  const prefix = lang === "en" ? "/en" : "";

  const copy =
    lang === "en"
      ? {
          title: "Compare two groups",
          text: "Choose two matches and compare the differences directly.",
          chooseOther: "Choose another group in one column to compare.",
          category: "Category",
          size: "Size",
          meetings: "Meetings",
          language: "Language",
          members: "Members",
          activities: "Activities",
          open: "open",
        }
      : {
          title: "Zwei Gruppen vergleichen",
          text: "Wähle zwei deiner Matches und sieh die Unterschiede direkt nebeneinander.",
          chooseOther: "Wähle in einer Spalte eine andere Gruppe, um zu vergleichen.",
          category: "Kategorie",
          size: "Größe",
          meetings: "Termine",
          language: "Sprache",
          members: "Mitglieder",
          activities: "Aktivitäten",
          open: "öffnen",
        };

  const filterLabel = new Map(filters.options.map((o) => [o.attribute, o.label]));
  const activities = (g: Group) =>
    g.selfRating.filterSelections.map((attr) => filterLabel.get(attr) ?? attr);

  const rows: Array<{ label: string; render: (g: Group, score: number) => React.ReactNode }> = [
    { label: "Match", render: (_g, score) => <span className="font-heading text-navy">{score}%</span> },
    { label: copy.category, render: (g) => g.categoryName },
    { label: copy.size, render: (g) => sizeLabel(g.groupSize, lang) },
    { label: copy.meetings, render: (g) => freqLabel(g.eventFrequency, lang) },
    { label: copy.language, render: (g) => langLabel(g.language, lang) },
    { label: copy.members, render: (g) => (g.memberCount ? String(g.memberCount) : "—") },
    {
      label: copy.activities,
      render: (g) => {
        const acts = activities(g);
        return acts.length ? acts.join(", ") : "—";
      },
    },
  ];

  return (
    <section className="border-poster bg-card p-5 sm:p-6">
      <h2 className="text-xl text-navy sm:text-2xl">{copy.title}</h2>
      <p className="mt-1 text-sm text-body">{copy.text}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { sel: aId, set: setAId, picked: a },
          { sel: bId, set: setBId, picked: b },
        ].map((col, i) => (
          <div key={i} className="flex flex-col items-center gap-2 text-center">
            <GroupLogo group={col.picked.group} size={56} />
            <select
              value={col.sel}
              onChange={(e) => col.set(e.target.value)}
              className="w-full min-w-0 border-2 border-navy bg-surface px-2 py-2 text-sm font-medium text-navy"
              aria-label={lang === "en" ? `Choose group ${i + 1}` : `Gruppe ${i + 1} wählen`}
            >
              {results.map((r) => (
                <option key={r.group.id} value={r.group.id}>
                  {r.group.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {a.group.id === b.group.id && (
        <p className="mt-3 text-center text-xs text-muted">{copy.chooseOther}</p>
      )}

      <dl className="mt-5 divide-y-2 divide-navy/15">
        {rows.map((row) => (
          <div key={row.label} className="py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {row.label}
            </dt>
            <dd className="mt-1 grid grid-cols-2 gap-3 text-sm text-navy">
              <span className="min-w-0 break-words">{row.render(a.group, a.score)}</span>
              <span className="min-w-0 break-words">{row.render(b.group, b.score)}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs font-semibold uppercase tracking-wide">
        <Link href={`${prefix}/groups/${a.group.slug}/`} className="text-accent-muted hover:text-navy">
          {a.group.name} {copy.open} →
        </Link>
        <Link href={`${prefix}/groups/${b.group.slug}/`} className="text-accent-muted hover:text-navy">
          {b.group.name} {copy.open} →
        </Link>
      </div>
    </section>
  );
}

function sizeLabel(s: string | null, lang: "de" | "en") {
  if (!s) return "—";
  const labels =
    lang === "en"
      ? { small: "Small", medium: "Medium", large: "Large" }
      : { small: "Klein", medium: "Mittel", large: "Groß" };
  return labels[s as keyof typeof labels] ?? s;
}

function freqLabel(f: string | null, lang: "de" | "en") {
  if (!f) return "—";
  const labels =
    lang === "en"
      ? { high: "Weekly", medium: "Monthly", low: "Occasionally" }
      : { high: "Wöchentlich", medium: "Monatlich", low: "Gelegentlich" };
  return labels[f as keyof typeof labels] ?? f;
}

function langLabel(l: string | null, lang: "de" | "en") {
  if (!l) return "—";
  const labels =
    lang === "en"
      ? { german: "German", english: "English", both: "DE & EN" }
      : { german: "Deutsch", english: "Englisch", both: "DE & EN" };
  return labels[l as keyof typeof labels] ?? l;
}
