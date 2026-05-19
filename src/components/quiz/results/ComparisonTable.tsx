// SPDX-License-Identifier: AGPL-3.0-only
// Wahl-O-Mat style comparison table: attributes as rows, groups as columns
"use client";

import type { QuizMatchResult } from "@/lib/quiz/types";
import { ALL_ATTRIBUTE_KEYS } from "@/lib/quiz/attribute-labels";
import { useTranslations } from "next-intl";

interface ComparisonTableProps {
  results: QuizMatchResult[];
  selectedIds: Set<string>;
  onToggle: (groupId: string) => void;
}

export function ComparisonTable({ results, selectedIds, onToggle }: ComparisonTableProps) {
  const t = useTranslations("results.comparison");
  const tAttr = useTranslations("attributes");
  const selected = results.filter((r) => selectedIds.has(r.group.id));

  if (selected.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm text-[#7a9aaa]">{t("empty")}</p>
      </div>
    );
  }

  // Only show attributes that at least one selected group has
  const relevantAttrs = ALL_ATTRIBUTE_KEYS.filter((attr) =>
    selected.some((r) => r.group.attributes[attr] !== undefined)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1a2a35]/10">
            <th className="sticky left-0 bg-white px-3 py-2 text-left font-medium text-[#5a7a8a] min-w-[120px]">
              {t("attributeHeader")}
            </th>
            {selected.map((r) => (
              <th key={r.group.id} className="px-2 py-2 text-center min-w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium text-[#1a2a35] truncate max-w-[100px]" title={r.group.name}>
                    {r.group.name.length > 12 ? r.group.name.slice(0, 12) + "…" : r.group.name}
                  </span>
                  <span className="font-bold text-[#5a8a9a]">{r.score}%</span>
                  <button
                    onClick={() => onToggle(r.group.id)}
                    className="text-[9px] text-red-400 hover:text-red-600"
                  >
                    {t("remove")}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {relevantAttrs.map((attr) => (
            <tr key={attr} className="border-b border-[#1a2a35]/5 hover:bg-[#f8fbfc]">
              <td className="sticky left-0 bg-white px-3 py-2 font-medium text-[#5a7a8a]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {tAttr(attr as any)}
              </td>
              {selected.map((r) => {
                const has = r.group.attributes[attr];
                // Find match info for this attribute
                const match = r.attributeMatches.find((m) => m.attribute === attr);
                const cellColor = match
                  ? match.category === "match"
                    ? "bg-green-50 text-green-700"
                    : match.category === "conflict"
                    ? "bg-red-50 text-red-600"
                    : "bg-yellow-50 text-yellow-700"
                  : has
                  ? "text-[#5a7a8a]"
                  : "text-[#ccc]";

                return (
                  <td key={r.group.id} className={`px-2 py-2 text-center font-bold ${cellColor}`}>
                    {has ? "✓" : "✗"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
