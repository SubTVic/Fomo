// SPDX-License-Identifier: AGPL-3.0-only
// Dev-only floating panel showing current block & variant info
// Only visible when ?dev=true is in the URL

"use client";

import { useSearchParams } from "next/navigation";
import type { Block } from "@/lib/pilot-variant-order";
import { VARIANT_INFO } from "@/lib/pilot-variant-order";

interface DevSwitcherProps {
  blocks?: Block[];
  currentBlockIdx?: number;
}

export function DevSwitcher({ blocks, currentBlockIdx }: DevSwitcherProps) {
  const searchParams = useSearchParams();
  const isDev = searchParams.get("dev") === "true";

  if (!isDev || !blocks) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Dev – Block {(currentBlockIdx ?? 0) + 1}/{blocks.length}
      </p>
      <div className="flex gap-1.5">
        {blocks.map((block, i) => {
          const info = VARIANT_INFO[block.variant];
          const isActive = i === currentBlockIdx;
          return (
            <div
              key={i}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {info.emoji} {info.name} ({block.dimensionIds.join(",")})
            </div>
          );
        })}
      </div>
    </div>
  );
}
