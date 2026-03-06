// SPDX-License-Identifier: AGPL-3.0-only

import type { MatchResult } from "@/types";

interface MatchCardProps {
  result: MatchResult;
  rank: number;
}

export function MatchCard({ result, rank }: MatchCardProps) {
  const { group, score } = result;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span
            className="w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: group.category.color ?? "#6b7280" }}
          >
            {group.category.name}
          </span>
          <h3 className="text-lg font-semibold">{group.name}</h3>
        </div>
        {/* Match score */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">{score}%</span>
          <span className="text-xs text-muted-foreground">Übereinstimmung</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground">{group.shortDescription}</p>

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm">
        {group.websiteUrl && (
          <a
            href={group.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Website
          </a>
        )}
        {group.instagramUrl && (
          <a
            href={group.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Instagram
          </a>
        )}
        {group.contactEmail && (
          <a
            href={`mailto:${group.contactEmail}`}
            className="font-medium underline underline-offset-2 hover:text-foreground transition-colors"
          >
            E-Mail schreiben
          </a>
        )}
      </div>

      {rank === 1 && (
        <p className="text-xs font-medium text-primary">Beste Übereinstimmung</p>
      )}
    </div>
  );
}
