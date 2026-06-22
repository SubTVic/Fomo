// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroups, getGroupBySlug, getQuizItems, categoryColorOf } from "@/lib/data";
import { GroupLinks } from "@/components/GroupLinks";
import type { Group } from "@/lib/types";

/** Pre-render one HTML page per group for the static export. */
export function generateStaticParams() {
  return getGroups().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) return { title: "Gruppe nicht gefunden" };
  return {
    title: group.name,
    description: group.shortDescription,
  };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) notFound();

  const meta: Array<[string, string]> = [];
  if (group.memberCount) meta.push(["Mitglieder", String(group.memberCount)]);
  if (group.groupSize) meta.push(["Größe", sizeLabel(group.groupSize)]);
  if (group.eventFrequency) meta.push(["Termine", frequencyLabel(group.eventFrequency)]);
  if (group.language) meta.push(["Sprache", languageLabel(group.language)]);
  if (group.foundedYear) meta.push(["Gegründet", String(group.foundedYear)]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-8 sm:px-6">
      <Link
        href="/groups"
        className="text-xs font-semibold uppercase tracking-wide text-body hover:text-navy"
      >
        ← Alle Gruppen
      </Link>

      <article className="mt-4 border-poster bg-card p-6 poster-shadow sm:p-8">
        <span
          className="w-fit px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: categoryColorOf(group) }}
        >
          {group.categoryName}
        </span>

        <h1 className="mt-3 text-3xl text-navy sm:text-4xl">{group.name}</h1>
        {group.motto && <p className="mt-2 text-lg italic text-accent-muted">„{group.motto}“</p>}

        <p className="mt-5 whitespace-pre-line text-body">{group.longDescription}</p>

        {meta.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {meta.map(([label, value]) => (
              <div key={label} className="border-2 border-navy bg-surface p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {group.nextEvent && (
          <div className="mt-6 border-2 border-navy bg-sky p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy">
              Nächstes Event{group.nextEvent.isOpen ? " · offen für alle" : ""}
            </p>
            <p className="mt-1 font-heading text-navy">{group.nextEvent.title}</p>
            <p className="mt-0.5 text-sm text-navy">
              {formatDate(group.nextEvent.date)}
              {group.nextEvent.time ? `, ${group.nextEvent.time}` : ""}
              {group.nextEvent.location ? ` · ${group.nextEvent.location}` : ""}
            </p>
          </div>
        )}

        <div className="mt-7">
          <GroupLinks group={group} />
        </div>

        <SelfRatingDetails group={group} />
      </article>
    </div>
  );
}

function SelfRatingDetails({ group }: { group: Group }) {
  const items = getQuizItems();
  const answerByItemId = new Map(group.selfRating.answers.map((a) => [a.itemId, a.value]));

  return (
    <details className="mt-7 border-2 border-navy bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold uppercase tracking-wider text-navy transition-colors hover:bg-sky">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>▶</span>
          Antworten der Gruppe auf die {items.length} Quiz-Fragen anzeigen
        </span>
      </summary>
      <div className="border-t-2 border-navy p-4 sm:p-5">
        {group.selfRating.derived && (
          <p className="mb-4 border-2 border-navy bg-card p-3 text-xs text-body">
            Diese Antworten wurden automatisch aus öffentlichen Daten abgeleitet, weil die
            Gruppe sich noch nicht selbst registriert hat — und sind daher unbestätigt.
          </p>
        )}
        <ol className="flex flex-col gap-3">
          {items.map((item, idx) => {
            const v = answerByItemId.get(item.id);
            return (
              <li key={item.id} className="flex flex-col gap-1.5 border-b border-navy/15 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 font-heading text-xs text-accent-muted">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-navy">{item.text}</p>
                </div>
                <div className="ml-7">
                  <AnswerBadge value={v} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
}

function AnswerBadge({ value }: { value: number | undefined }) {
  const meta =
    value === 1
      ? { label: "Stimme zu", bg: "#1a2a35", fg: "#ADD8E6" }
      : value === -1
        ? { label: "Stimme nicht zu", bg: "#fff", fg: "#1a2a35" }
        : { label: "Neutral", bg: "#5a8a9a", fg: "#fff" };
  return (
    <span
      className="inline-block border-2 border-navy px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  );
}

function sizeLabel(s: string): string {
  return { small: "Klein", medium: "Mittel", large: "Groß" }[s] ?? s;
}
function frequencyLabel(f: string): string {
  return { high: "Wöchentlich", medium: "Monatlich", low: "Gelegentlich" }[f] ?? f;
}
function languageLabel(l: string): string {
  return { german: "Deutsch", english: "Englisch", both: "Deutsch & Englisch" }[l] ?? l;
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
