// SPDX-License-Identifier: AGPL-3.0-only
// Expandable result card for a single matched group
"use client";

import { useState } from "react";
import type { QuizMatchResult } from "@/lib/quiz/types";

interface ResultCardProps {
  result: QuizMatchResult;
  rank: number;
  isComparing: boolean;
  onToggleCompare: () => void;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

function scoreColor(score: number): string {
  if (score >= 66) return "bg-green-500";
  if (score >= 33) return "bg-yellow-500";
  return "bg-red-400";
}

function scoreTextColor(score: number): string {
  if (score >= 66) return "text-green-700";
  if (score >= 33) return "text-yellow-700";
  return "text-red-600";
}

export function ResultCard({ result, rank, isComparing, onToggleCompare }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { group, score, attributeMatches } = result;

  const matches = attributeMatches.filter((a) => a.category === "match");
  const partials = attributeMatches.filter((a) => a.category === "partial");
  const conflicts = attributeMatches.filter((a) => a.category === "conflict");

  return (
    <div className="px-4 py-3">
      {/* Collapsed view */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="text-lg shrink-0 w-8 text-center">
          {rank <= 3 ? RANK_ICONS[rank - 1] : <span className="text-sm text-[#7a9aaa]">#{rank}</span>}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[#1a2a35] truncate">{group.name}</span>
            <span className="text-xs text-[#7a9aaa]">{group.categoryName}</span>
          </div>
          {/* Score bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-[#e8f4f8] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${scoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${scoreTextColor(score)}`}>
              {score}%
            </span>
          </div>
        </div>
        <span className="text-xs text-[#7a9aaa] shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-3 ml-11 space-y-3">
          <p className="text-sm text-[#5a7a8a]">{group.shortDescription}</p>

          {/* Attribute badges */}
          {matches.length > 0 && (
            <div>
              <span className="text-xs font-medium text-green-700 uppercase">Passt</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {matches.map((a) => (
                  <span key={a.attribute} className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-medium">
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {partials.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[#7a9aaa] uppercase">Teilweise</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {partials.map((a) => (
                  <span key={a.attribute} className="rounded-full bg-[#e8f4f8] text-[#5a7a8a] px-2 py-0.5 text-[10px] font-medium">
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {conflicts.length > 0 && (
            <div>
              <span className="text-xs font-medium text-red-600 uppercase">Passt weniger</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {conflicts.map((a) => (
                  <span key={a.attribute} className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-medium">
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next event */}
          {group.nextEventDate && group.nextEventTitle && (
            <div className="rounded border border-[#1a2a35]/10 bg-[#f0f8fc] px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">📅</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1a2a35]">{group.nextEventTitle}</p>
                  <p className="text-xs text-[#5a7a8a] mt-0.5">
                    {group.nextEventDate}
                    {group.nextEventTime && ` · ${group.nextEventTime}`}
                    {group.nextEventLocation && ` · ${group.nextEventLocation}`}
                  </p>
                  {group.nextEventIsOpen && (
                    <span className="inline-block mt-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Offen für alle
                    </span>
                  )}
                </div>
                {group.nextEventUrl && (
                  <a
                    href={group.nextEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-xs text-[#5a8a9a] underline underline-offset-2 hover:text-[#1a2a35]"
                  >
                    Details
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {group.contactEmail && (
              <a
                href={`mailto:${group.contactEmail}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-2 border-[#1a2a35] bg-[#1a2a35] px-3 py-1.5 text-xs font-bold text-[#ADD8E6] hover:bg-[#2a3a45] transition-colors"
              >
                E-Mail schreiben
              </a>
            )}
            {group.websiteUrl && (
              <a
                href={group.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded border border-[#1a2a35]/20 px-3 py-1.5 text-xs hover:bg-[#f0f4f6] transition-colors"
              >
                Website
              </a>
            )}
            {group.instagramUrl && (
              <a
                href={group.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded border border-[#1a2a35]/20 px-3 py-1.5 text-xs hover:bg-[#f0f4f6] transition-colors"
              >
                Instagram
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
              className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                isComparing
                  ? "border-[#1a2a35] bg-[#1a2a35] text-[#ADD8E6]"
                  : "border-[#1a2a35]/20 hover:bg-[#f0f4f6]"
              }`}
            >
              {isComparing ? "✓ Verglichen" : "Vergleichen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
