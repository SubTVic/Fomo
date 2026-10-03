// SPDX-License-Identifier: AGPL-3.0-only
// Small fixtures and a seeded PRNG shared by the matching tests.

import type { Group } from "../types";

/** Deterministic PRNG (mulberry32) so random-profile tests are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Minimal group for unit tests: answers keyed by item id, optional filters. */
export function makeGroup(
  slug: string,
  answers: Record<string, number>,
  filterSelections: string[] = [],
): Group {
  return {
    id: slug,
    name: slug,
    slug,
    shortDescription: "",
    longDescription: "",
    categoryName: "Test",
    categoryColor: "",
    categoryIcon: "",
    websiteUrl: null,
    instagramUrl: null,
    contactEmail: null,
    memberCount: null,
    language: null,
    eventFrequency: null,
    groupSize: null,
    motto: null,
    foundedYear: null,
    logoUrl: null,
    selfRating: {
      raterCount: 1,
      filterSelections,
      answers: Object.entries(answers).map(([itemId, value]) => ({ itemId, value })),
    },
  };
}
