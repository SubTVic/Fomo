// SPDX-License-Identifier: AGPL-3.0-only
// Assigns dimensions to blocks and shuffles variant order per participant

export type VariantKey = "scroll" | "classic" | "swipe" | "chat";

export interface Block {
  index: number;
  dimensionIds: string[];
  variant: VariantKey;
}

// 10 dimensions split into 4 blocks (3-2-3-2)
const BLOCK_DIMENSIONS: string[][] = [
  ["D1", "D2", "D3"], // 18 questions
  ["D4", "D5"],       // 12 questions
  ["D6", "D7", "D8"], // 18 questions
  ["D9", "D10"],      // 12 questions
];

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

/** Generate a random variant order and build block assignments */
export function generateBlocks(): Block[] {
  const shuffled = shuffle(ALL_VARIANTS);
  return BLOCK_DIMENSIONS.map((dimIds, i) => ({
    index: i,
    dimensionIds: dimIds,
    variant: shuffled[i],
  }));
}

/** Get the variant order from blocks (for storing in DB) */
export function getVariantOrder(blocks: Block[]): VariantKey[] {
  return blocks.map((b) => b.variant);
}

/** Find which block a dimension belongs to */
export function getBlockForDimension(blocks: Block[], dimensionId: string): Block | undefined {
  return blocks.find((b) => b.dimensionIds.includes(dimensionId));
}

/** Variant display info for transition screens and preference question */
export const VARIANT_INFO: Record<VariantKey, { name: string; emoji: string; description: string }> = {
  scroll: { name: "Scroll", emoji: "📜", description: "Alle Fragen einer Kategorie auf einen Blick" },
  classic: { name: "Classic", emoji: "📋", description: "Eine Frage pro Seite, drei Buttons" },
  swipe: { name: "Swipe", emoji: "👆", description: "Karten wischen wie bei Tinder" },
  chat: { name: "Chat", emoji: "💬", description: "Fragen im Messenger-Stil" },
};
