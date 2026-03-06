// SPDX-License-Identifier: AGPL-3.0-only
// Transition screen shown between variant blocks

"use client";

import type { VariantKey } from "@/lib/pilot-variant-order";
import { VARIANT_INFO } from "@/lib/pilot-variant-order";

interface VariantTransitionProps {
  variant: VariantKey;
  blockIndex: number; // 0-3
  totalBlocks: number;
  onContinue: () => void;
}

export function VariantTransition({ variant, blockIndex, totalBlocks, onContinue }: VariantTransitionProps) {
  const info = VARIANT_INFO[variant];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-sm flex flex-col items-center gap-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Abschnitt {blockIndex + 1} von {totalBlocks}
        </div>

        <div className="text-6xl">{info.emoji}</div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Neues Layout: {info.name}</h2>
          <p className="text-muted-foreground">{info.description}</p>
        </div>

        <button
          onClick={onContinue}
          className="rounded-xl bg-primary px-8 py-4 text-primary-foreground font-semibold text-lg transition-transform active:scale-[0.98]"
        >
          Los geht&apos;s!
        </button>
      </div>
    </div>
  );
}
