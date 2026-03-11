// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { LiveMatchResult } from "@/lib/live-quiz/types";

interface LiveResultCardProps {
  result: LiveMatchResult;
  rank: number;
  isExpanded: boolean;
  isCompareSelected: boolean;
  onToggleExpand: () => void;
  onToggleCompare: () => void;
  onSwitchToCompare: () => void;
}

function rankLabel(rank: number): string {
  if (rank === 1) return "\uD83E\uDD47";
  if (rank === 2) return "\uD83E\uDD48";
  if (rank === 3) return "\uD83E\uDD49";
  return `#${rank}`;
}

function scoreColor(score: number): string {
  if (score >= 66) return "text-[#22c55e]";
  if (score >= 33) return "text-[#eab308]";
  return "text-[#ef4444]";
}

function scoreBarColor(score: number): string {
  if (score >= 66) return "bg-[#22c55e]";
  if (score >= 33) return "bg-[#eab308]";
  return "bg-[#ef4444]";
}

export function LiveResultCard({
  result,
  rank,
  isExpanded,
  isCompareSelected,
  onToggleExpand,
  onToggleCompare,
  onSwitchToCompare,
}: LiveResultCardProps) {
  const { group, score, attributeMatches } = result;

  const matches = attributeMatches.filter((a) => a.category === "match");
  const partials = attributeMatches.filter((a) => a.category === "partial");
  const conflicts = attributeMatches.filter((a) => a.category === "conflict");

  // Top 3 match badges for collapsed view
  const topMatches = matches.slice(0, 3);

  return (
    <div className="border-2 border-foreground bg-card transition-all">
      {/* Clickable header */}
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-4 py-4 sm:px-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 font-heading text-lg">
              {rankLabel(rank)}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-sm uppercase truncate">
                {group.name}
              </h3>
              {/* Top match badges (collapsed) */}
              {topMatches.length > 0 && !isExpanded && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {topMatches.map((a) => (
                    <span
                      key={a.attribute}
                      className="inline-block bg-[#22c55e]/15 text-[#16a34a] text-[10px] px-1.5 py-0.5 font-medium"
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <span className={`font-heading text-2xl tabular-nums ${scoreColor(score)}`}>
              {score}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Match
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3 h-2 overflow-hidden bg-muted">
          <div
            className={`h-full transition-all duration-500 ${scoreBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>

        {!isExpanded && (
          <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider text-center">
            Klicken für Details
          </p>
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t-2 border-foreground/20 px-4 py-4 sm:px-5 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{group.description}</p>

          {/* Match badges */}
          {matches.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Übereinstimmungen
              </h4>
              <div className="flex flex-wrap gap-1">
                {matches.map((a) => (
                  <span
                    key={a.attribute}
                    className="inline-block bg-[#22c55e]/15 text-[#16a34a] text-xs px-2 py-0.5 font-medium"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Partial badges */}
          {partials.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Teilweise
              </h4>
              <div className="flex flex-wrap gap-1">
                {partials.map((a) => (
                  <span
                    key={a.attribute}
                    className="inline-block bg-[#eab308]/15 text-[#ca8a04] text-xs px-2 py-0.5 font-medium"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conflict badges */}
          {conflicts.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Konflikte
              </h4>
              <div className="flex flex-wrap gap-1">
                {conflicts.map((a) => (
                  <span
                    key={a.attribute}
                    className="inline-block bg-[#ef4444]/15 text-[#dc2626] text-xs px-2 py-0.5 font-medium"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {group.website && (
            <a
              href={group.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Website
            </a>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwitchToCompare();
              }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Vergleichen
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`text-xs underline underline-offset-2 transition-colors ${
                isCompareSelected
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isCompareSelected ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
