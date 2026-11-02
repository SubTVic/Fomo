// SPDX-License-Identifier: AGPL-3.0-only
// Areas ("Bereiche"): the 5 coarse quiz filters since 11/2026 (replacing the
// 8 activity filters). Groups pick 1–2. Same resolution order as the public
// site (static-site/src/lib/areas.ts):
//   own area choice in the DB → team assignment in static-site/data/areas.json
//   → mechanical translation of the old activity filters.
import { WS2_FILTER } from "./ws2-items";
import areasJson from "../../static-site/data/areas.json";

export const MAX_AREAS_PER_GROUP = 2;

export const AREA_IDS: string[] = WS2_FILTER.options.map((o) => o.attribute);
const AREA_SET = new Set(AREA_IDS);

const LEGACY_TO_AREA = new Map(
  WS2_FILTER.options.flatMap((o) => (o.legacyAttributes ?? []).map((l) => [l, o.attribute] as const)),
);

const ASSIGNED = (areasJson as { assignments: Record<string, { areas: string[] }> }).assignments;

export function isArea(value: string): boolean {
  return AREA_SET.has(value);
}

/** Areas for a stored selection (old filters or areas) of the group with this slug. */
export function resolveAreas(selections: unknown, slug: string | null | undefined): string[] {
  const list = Array.isArray(selections) ? selections.filter((x): x is string => typeof x === "string") : [];
  if (list.some(isArea)) return AREA_IDS.filter((a) => list.includes(a));
  const assigned = slug ? ASSIGNED[slug]?.areas : undefined;
  if (assigned?.length) return AREA_IDS.filter((a) => assigned.includes(a));
  const wanted = new Set(list.map((s) => LEGACY_TO_AREA.get(s) ?? s));
  return AREA_IDS.filter((a) => wanted.has(a));
}

/** Zod-friendly check for a submitted area list (1–2 known areas, no duplicates). */
export function isValidAreaSelection(list: string[]): boolean {
  return (
    list.length >= 1 &&
    list.length <= MAX_AREAS_PER_GROUP &&
    new Set(list).size === list.length &&
    list.every(isArea)
  );
}
