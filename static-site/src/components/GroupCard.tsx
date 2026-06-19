// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import type { Group } from "@/lib/types";
import { track, EVENTS } from "@/lib/analytics";

interface GroupCardProps {
  group: Group;
  /** When set, renders a match-score badge (quiz results). */
  score?: number;
  /** 1-based rank for the results list. */
  rank?: number;
}

export function GroupCard({ group, score, rank }: GroupCardProps) {
  return (
    <article className="flex flex-col gap-3 border-poster bg-card p-5 transition-transform hover:-translate-y-0.5 hover:poster-shadow">
      <div className="flex items-start justify-between gap-3">
        <span
          className="w-fit px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: group.categoryColor }}
        >
          {group.categoryName}
        </span>
        {score !== undefined && (
          <span className="flex shrink-0 items-baseline gap-1 border-2 border-navy bg-sky px-2 py-1 font-heading text-navy">
            {rank !== undefined && <span className="text-xs">#{rank}</span>}
            <span className="text-lg leading-none">{score}%</span>
          </span>
        )}
      </div>

      <div>
        <h3 className="font-heading text-base text-navy">{group.name}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-body">{group.shortDescription}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs">
        <Link
          href={`/groups/${group.slug}`}
          className="font-semibold uppercase tracking-wide text-navy underline underline-offset-4 hover:text-accent-muted"
        >
          Mehr erfahren
        </Link>
        {group.websiteUrl && (
          <a
            href={group.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(EVENTS.groupClick, { group: group.slug, dest: "website" })}
            className="text-body underline underline-offset-4 hover:text-navy"
          >
            Website
          </a>
        )}
        {group.instagramUrl && (
          <a
            href={group.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(EVENTS.groupClick, { group: group.slug, dest: "instagram" })}
            className="text-body underline underline-offset-4 hover:text-navy"
          >
            Instagram
          </a>
        )}
        {group.contactEmail && (
          <a
            href={`mailto:${group.contactEmail}`}
            onClick={() => track(EVENTS.groupClick, { group: group.slug, dest: "email" })}
            className="text-body underline underline-offset-4 hover:text-navy"
          >
            E-Mail
          </a>
        )}
      </div>
    </article>
  );
}
