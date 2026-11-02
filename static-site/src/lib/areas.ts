// SPDX-License-Identifier: AGPL-3.0-only
// Areas ("Bereiche") — the coarse hard filter of the quiz since 11/2026.
//
// Students pick one or more of 5 areas; the 21 questions do the fine ranking.
// A group's areas are resolved in this order:
//   1. its own choice in the admin DB, if it already uses the new area ids
//      (a group that edited its profile always wins),
//   2. the team's assignment in data/areas.json (by slug),
//   3. a mechanical translation of the 8 old activity filters
//      (QuizFilterOption.legacyAttributes).
// scripts/report.mjs keeps a copy of resolveAreas (parity test).

import type { QuizFilters } from "./types";

/** An area is only offered on the filter screen with at least this many
 *  verified groups — a tiny pool leaves the questions nothing to rank. */
export const MIN_AREA_POOL = 5;

/** At most this many areas per group (1–2: the group's core, not "everything"). */
export const MAX_AREAS_PER_GROUP = 2;

export function areaIds(filters: QuizFilters): string[] {
  return filters.options.map((o) => o.attribute);
}

/** Old activity filter → area attribute (e.g. "music" → "culture"). */
export function legacyAreaMap(filters: QuizFilters): Map<string, string> {
  const map = new Map<string, string>();
  for (const o of filters.options) for (const legacy of o.legacyAttributes ?? []) map.set(legacy, o.attribute);
  return map;
}

/** Translate any mix of old filter / area ids into areas (deduped, option order). */
export function toAreas(selections: string[], filters: QuizFilters): string[] {
  const legacy = legacyAreaMap(filters);
  const wanted = new Set(selections.map((s) => legacy.get(s) ?? s));
  return areaIds(filters).filter((a) => wanted.has(a));
}

/** The areas a group is filtered by — see the order at the top of this file. */
export function resolveAreas(
  selections: string[],
  assigned: string[] | undefined,
  filters: QuizFilters,
): string[] {
  const ids = new Set(areaIds(filters));
  if (selections.some((s) => ids.has(s))) return areaIds(filters).filter((a) => selections.includes(a));
  if (assigned && assigned.length > 0) return areaIds(filters).filter((a) => assigned.includes(a));
  return toAreas(selections, filters);
}
