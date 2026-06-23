// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Group, QuizFilters } from "@/lib/types";
import { GroupLogo } from "@/components/GroupLogo";

interface CompareGroupsProps {
  /** The ranked matches (group + score), in display order. */
  results: Array<{ group: Group; score: number }>;
  filters: QuizFilters;
}

const sizeLabel = (s: string | null) =>
  s ? ({ small: "Klein", medium: "Mittel", large: "Groß" }[s] ?? s) : "—";
const freqLabel = (f: string | null) =>
  f ? ({ high: "Wöchentlich", medium: "Monatlich", low: "Gelegentlich" }[f] ?? f) : "—";
const langLabel = (l: string | null) =>
  l ? ({ german: "Deutsch", english: "Englisch", both: "DE & EN" }[l] ?? l) : "—";

/**
 * Side-by-side comparison of two groups from the results. Lets a user weigh two
 * matches directly (score, category, size, rhythm, language, activities,
 * contact) instead of jumping between two detail pages.
 */
export function CompareGroups({ results, filters }: CompareGroupsProps) {
  const [aId, setAId] = useState(results[0].group.id);
  const [bId, setBId] = useState(results[1].group.id);

  const a = results.find((r) => r.group.id === aId) ?? results[0];
  const b = results.find((r) => r.group.id === bId) ?? results[1];

  const filterLabel = new Map(filters.options.map((o) => [o.attribute, o.label]));
  const activities = (g: Group) =>
    g.selfRating.filterSelections.map((attr) => filterLabel.get(attr) ?? attr);

  const rows: Array<{ label: string; render: (g: Group, score: number) => React.ReactNode }> = [
    { label: "Match", render: (_g, score) => <span className="font-heading text-navy">{score}%</span> },
    { label: "Kategorie", render: (g) => g.categoryName },
    { label: "Größe", render: (g) => sizeLabel(g.groupSize) },
    { label: "Termine", render: (g) => freqLabel(g.eventFrequency) },
    { label: "Sprache", render: (g) => langLabel(g.language) },
    { label: "Mitglieder", render: (g) => (g.memberCount ? String(g.memberCount) : "—") },
    {
      label: "Aktivitäten",
      render: (g) => {
        const acts = activities(g);
        return acts.length ? acts.join(", ") : "—";
      },
    },
  ];

  return (
    <section className="mt-10 border-poster bg-card p-5 sm:p-6">
      <h2 className="text-xl text-navy sm:text-2xl">Zwei Gruppen vergleichen</h2>
      <p className="mt-1 text-sm text-body">
        Wähle zwei deiner Matches und sieh die Unterschiede direkt nebeneinander.
      </p>

      {/* Pickers + logos */}
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
              aria-label={`Gruppe ${i + 1} wählen`}
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
        <p className="mt-3 text-center text-xs text-muted">
          Wähle in einer Spalte eine andere Gruppe, um zu vergleichen.
        </p>
      )}

      {/* Comparison rows: label spans full width, then the two values aligned. */}
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

      {/* Quick links to each full profile */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs font-semibold uppercase tracking-wide">
        <Link href={`/groups/${a.group.slug}/`} className="text-accent-muted hover:text-navy">
          {a.group.name} öffnen →
        </Link>
        <Link href={`/groups/${b.group.slug}/`} className="text-accent-muted hover:text-navy">
          {b.group.name} öffnen →
        </Link>
      </div>
    </section>
  );
}
