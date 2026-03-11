// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { LiveMatchResult, GroupAttribute } from "@/lib/live-quiz/types";
import { ATTRIBUTE_LABELS } from "@/lib/live-quiz/questions";

interface LiveCompareTabProps {
  results: LiveMatchResult[];
  compareIds: Set<string>;
  onToggleCompare: (id: string) => void;
}

/** All attributes in display order */
const ALL_ATTRIBUTES: GroupAttribute[] = [
  "career", "tech", "language", "social_impact", "party", "religion",
  "sports", "networking", "arts", "music", "time_low", "hands_on",
  "outdoor", "international", "beginner_friendly", "competitive",
  "event_frequency", "leadership_opportunities", "group_size",
];

export function LiveCompareTab({
  results,
  compareIds,
  onToggleCompare,
}: LiveCompareTabProps) {
  const selectedResults = results.filter((r) => compareIds.has(r.group.id));

  return (
    <div className="px-5 py-5 sm:px-8 flex flex-col gap-5">
      {/* Group selector */}
      <div>
        <h3 className="font-heading text-xs uppercase tracking-wider mb-2">
          Gruppen auswählen (max. 8)
        </h3>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <label
              key={r.group.id}
              className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:bg-muted/50 px-1 transition-colors"
            >
              <input
                type="checkbox"
                checked={compareIds.has(r.group.id)}
                onChange={() => onToggleCompare(r.group.id)}
                disabled={!compareIds.has(r.group.id) && compareIds.size >= 8}
                className="shrink-0 accent-foreground"
              />
              <span className="truncate">{r.group.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums ml-auto">
                {r.score}%
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      {selectedResults.length > 0 ? (
        <div className="overflow-x-auto -mx-5 sm:-mx-8 px-5 sm:px-8">
          <table className="w-full text-xs border-collapse min-w-[400px]">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3 font-heading text-[10px] uppercase tracking-wider border-b-2 border-foreground sticky left-0 bg-card">
                  Attribut
                </th>
                {selectedResults.map((r) => (
                  <th
                    key={r.group.id}
                    className="py-2 px-2 font-heading text-[10px] uppercase tracking-wider border-b-2 border-foreground text-center"
                  >
                    <div className="truncate max-w-[80px]">{r.group.name}</div>
                    <div className="text-muted-foreground font-normal mt-0.5">
                      {r.score}%
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_ATTRIBUTES.map((attr) => (
                <tr key={attr} className="border-b border-foreground/10">
                  <td className="py-1.5 pr-3 text-muted-foreground sticky left-0 bg-card">
                    {ATTRIBUTE_LABELS[attr]}
                  </td>
                  {selectedResults.map((r) => {
                    const hasAttr = r.group.attributes[attr] === 1;
                    // Find if user cares about this attribute
                    const attrMatch = r.attributeMatches.find(
                      (a) => a.attribute === attr,
                    );
                    let cellBg = "";
                    if (attrMatch) {
                      if (attrMatch.category === "match") cellBg = "bg-[#22c55e]/10";
                      else if (attrMatch.category === "conflict") cellBg = "bg-[#ef4444]/10";
                    }
                    return (
                      <td
                        key={r.group.id}
                        className={`py-1.5 px-2 text-center ${cellBg}`}
                      >
                        {hasAttr ? (
                          <span className="text-[#22c55e] font-bold">&#10003;</span>
                        ) : (
                          <span className="text-muted-foreground/40">&#10007;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">
          Wähle mindestens eine Gruppe zum Vergleichen aus.
        </p>
      )}

      {/* Legend */}
      {selectedResults.length > 0 && (
        <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 bg-[#22c55e]/10 border border-[#22c55e]/30" />
            Passt zu dir
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 bg-[#ef4444]/10 border border-[#ef4444]/30" />
            Passt nicht
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#22c55e] font-bold">&#10003;</span>
            Gruppe hat Attribut
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/40">&#10007;</span>
            Gruppe hat Attribut nicht
          </div>
        </div>
      )}
    </div>
  );
}
