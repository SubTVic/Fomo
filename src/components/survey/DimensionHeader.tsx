// SPDX-License-Identifier: AGPL-3.0-only
// Prominent dimension header with priming context and reminder.
// Used across all survey variants to keep participants in the Hochschulgruppen frame.

"use client";

import type { Dimension } from "@/lib/pilot-questions";
import { getDimensionPriming } from "@/lib/dimension-priming";

interface DimensionHeaderProps {
  dimension: Dimension;
  dimIndex: number;
  totalDimensions: number;
  compact?: boolean; // For variants with limited space (swipe, chat)
}

export function DimensionHeader({
  dimension,
  dimIndex,
  totalDimensions,
  compact = false,
}: DimensionHeaderProps) {
  const priming = getDimensionPriming(dimension.id);

  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-muted px-3 py-2.5">
        <span className="text-lg flex-shrink-0">{dimension.emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {dimension.label}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({dimIndex + 1}/{totalDimensions})
            </span>
          </p>
          {priming && (
            <p className="text-xs text-muted-foreground mt-0.5">{priming.context}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-l-4 border-l-primary bg-muted/30 px-4 py-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{dimension.emoji}</span>
        <h3 className="text-lg font-bold">{dimension.label}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          Dimension {dimIndex + 1}/{totalDimensions}
        </span>
      </div>
      {priming && (
        <>
          <p className="text-sm text-foreground/80 mt-1">{priming.context}</p>
          <p className="text-xs text-muted-foreground mt-1 italic">{priming.reminder}</p>
        </>
      )}
    </div>
  );
}
