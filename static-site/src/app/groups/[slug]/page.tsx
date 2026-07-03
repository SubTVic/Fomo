// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGroups, getGroupBySlug, getQuizFilters, categoryColorOf, isUnverified } from "@/lib/data";
import { GroupLinks } from "@/components/GroupLinks";
import { GroupLogo } from "@/components/GroupLogo";
import { BackLink } from "@/components/BackLink";
import { UnverifiedNotice } from "@/components/UnverifiedNotice";
import { GroupAttributes } from "@/components/GroupAttributes";
import { seoAlternates, absAsset, groupOrganizationLd, breadcrumbLd } from "@/lib/site";

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
    alternates: seoAlternates(`/groups/${slug}`, `/en/groups/${slug}`, "de"),
    openGraph: {
      type: "website",
      title: `${group.name} — FOMO`,
      description: group.shortDescription,
      // Fall back to the site OG image so link previews (WhatsApp, Instagram,
      // Discord, …) never render blank for the ~90% of groups without a logo.
      images: group.logoUrl
        ? [{ url: absAsset(group.logoUrl), alt: group.name }]
        : [{ url: "/og.png", width: 1200, height: 630, alt: "FOMO — Finde deine Hochschulgruppe" }],
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(groupOrganizationLd(group, "de", group.shortDescription)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbLd([
              { name: "Start", path: "/" },
              { name: "Gruppen", path: "/groups" },
              { name: group.name, path: `/groups/${group.slug}` },
            ]),
          ),
        }}
      />
      <BackLink />

      <article className="mt-4 border-poster bg-card p-6 poster-shadow sm:p-8">
        <div className="flex items-start gap-4">
          <GroupLogo group={group} size={72} />
          <div className="min-w-0">
            <span
              className="w-fit px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColorOf(group) }}
            >
              {group.categoryName}
            </span>
            <h1 className="mt-2 hyphens-auto break-words text-3xl text-navy sm:text-4xl">
              {group.name}
            </h1>
          </div>
        </div>

        {group.motto && <p className="mt-2 text-lg italic text-accent-muted">„{group.motto}“</p>}

        {isUnverified(group) && (
          <div className="mt-4">
            <UnverifiedNotice />
          </div>
        )}

        <p className="mt-5 whitespace-pre-line text-body">{group.longDescription}</p>

        {meta.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {meta.map(([label, value]) => (
              <div key={label} className=" border-2 border-navy bg-surface p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <GroupAttributes group={group} filters={getQuizFilters()} lang="de" />

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
      </article>
    </div>
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
