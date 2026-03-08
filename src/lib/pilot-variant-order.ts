// SPDX-License-Identifier: AGPL-3.0-only
// Assigns dimensions to blocks and shuffles variant order per participant

export type VariantKey = "scroll" | "classic" | "swipe" | "chat";

export interface Block {
  index: number;
  dimensionIds: string[];
  variant: VariantKey;
}

// Fisher-Yates shuffle (in-place)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_VARIANTS: VariantKey[] = ["scroll", "classic", "swipe", "chat"];

/** Generate blocks from dimensions (grouped by blockIndex). */
export function generateBlocks(
  dimensions: { id: string; blockIndex: number }[],
): Block[] {
  // Group dimensions by blockIndex
  const blockMap = new Map<number, string[]>();
  for (const d of dimensions) {
    const existing = blockMap.get(d.blockIndex) ?? [];
    existing.push(d.id);
    blockMap.set(d.blockIndex, existing);
  }

  // Get sorted block indices that have dimensions
  const blockIndices = [...blockMap.keys()].sort((a, b) => a - b);
  const shuffled = shuffle(ALL_VARIANTS);

  return blockIndices.map((bi, i) => ({
    index: i,
    dimensionIds: blockMap.get(bi) ?? [],
    variant: shuffled[i % shuffled.length],
  }));
}

/** Get the variant order from blocks (for storing in DB) */
export function getVariantOrder(blocks: Block[]): VariantKey[] {
  return blocks.map((b) => b.variant);
}

/** Find which block a dimension belongs to */
export function getBlockForDimension(
  blocks: Block[],
  dimensionId: string,
): Block | undefined {
  return blocks.find((b) => b.dimensionIds.includes(dimensionId));
}

/** Variant display info for transition screens and preference question */
export const VARIANT_INFO: Record<
  VariantKey,
  { name: string; emoji: string; description: string }
> = {
  scroll: {
    name: "Scroll",
    emoji: "📜",
    description: "Alle Fragen einer Kategorie auf einen Blick",
  },
  classic: {
    name: "Classic",
    emoji: "📋",
    description: "Eine Frage pro Seite, drei Buttons",
  },
  swipe: {
    name: "Swipe",
    emoji: "👆",
    description: "Karten wischen wie bei Tinder",
  },
  chat: {
    name: "Chat",
    emoji: "💬",
    description: "Fragen im Messenger-Stil",
  },
};
