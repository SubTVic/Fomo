// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useRouter } from "next/navigation";
import type { Group } from "@/lib/types";
import { categoryColorOf } from "@/lib/data";
import { track, EVENTS } from "@/lib/analytics";
import { GroupLogo } from "./GroupLogo";

interface GroupCardProps {
  group: Group;
  /** Result variant: shows the match-score badge and links to the detail page. */
  score?: number;
  /** Competition rank; shared by groups with the same score. */
  rank?: number;
  /** True when this group shares its score with another (equally good fit). */
  tied?: boolean;
  /** Encoded results, carried into the detail link so "back" returns here. */
  resultsParam?: string;
}

export function GroupCard({ group, score, rank, tied, resultsParam }: GroupCardProps) {
  const isResult = score !== undefined;
  const router = useRouter();

  const detailHref = `/groups/${group.slug}/${resultsParam ? `?r=${encodeURIComponent(resultsParam)}` : ""}`;

  // Both variants open the group's own detail page ("Mehr anzeigen" → eigener
  // Screen). Result cards carry the encoded results so the back link returns
  // to the ranking.
  function openDetail() {
    router.push(detailHref);
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const links = buildLinks(group);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
      className="flex cursor-pointer flex-col gap-3 border-poster bg-card p-5 transition-transform hover:-translate-y-0.5 hover:poster-shadow"
    >
      <div className="flex items-start gap-3">
        <GroupLogo group={group} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className="w-fit px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColorOf(group) }}
            >
              {group.categoryName}
            </span>
            {isResult && (
              <span className="flex shrink-0 flex-col items-end">
                <span className="flex items-baseline gap-1 border-2 border-navy bg-sky px-2 py-1 font-heading text-navy">
                  {rank !== undefined && <span className="text-xs">#{rank}</span>}
                  <span className="text-lg leading-none">{score}%</span>
                </span>
                {tied && (
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-accent-muted">
                    punktgleich
                  </span>
                )}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 break-words font-heading text-base text-navy">{group.name}</h3>
          {group.selfRating.derived && (
            <span
              className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-muted"
              title="Profil automatisch ermittelt, noch nicht von der Gruppe bestätigt."
            >
              ⓘ unbestätigt
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-body line-clamp-3">{group.shortDescription}</p>

      {/* Both variants link to the group's own detail screen. */}
      <span className="text-xs font-semibold uppercase tracking-wide text-accent-muted">
        {isResult ? "Antippen für Details →" : "Mehr anzeigen →"}
      </span>

      {isResult && links.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs" onClick={stop}>
          {links.map((l) => (
            <a
              key={l.dest}
              href={l.href}
              target={l.dest === "email" ? undefined : "_blank"}
              rel={l.dest === "email" ? undefined : "noopener noreferrer"}
              onClick={() => track(EVENTS.groupClick, { group: group.slug, dest: l.dest })}
              className="text-body underline underline-offset-4 hover:text-navy"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function buildLinks(group: Group) {
  const links: Array<{ href: string; label: string; dest: string }> = [];
  if (group.websiteUrl) links.push({ href: group.websiteUrl, label: "Website", dest: "website" });
  if (group.instagramUrl) links.push({ href: group.instagramUrl, label: "Instagram", dest: "instagram" });
  if (group.contactEmail) links.push({ href: `mailto:${group.contactEmail}`, label: "E-Mail", dest: "email" });
  return links;
}
