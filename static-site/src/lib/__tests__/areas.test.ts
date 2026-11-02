// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { resolveAreas, toAreas, MAX_AREAS_PER_GROUP } from "../areas";
import { decodeResults, encodeResults } from "../results";
import { getGroups, getQuizFilters, getQuizItems } from "../data";
import areasJson from "../../../data/areas.json";

const filters = getQuizFilters();
const items = getQuizItems();
const ids = filters.options.map((o) => o.attribute);

describe("areas", () => {
  it("translates every old activity filter into an area (competitive is dropped)", () => {
    expect(toAreas(["sports", "outdoor"], filters)).toEqual(["sport"]);
    expect(toAreas(["music", "party", "competitive"], filters)).toEqual(["culture", "engagement"]);
    for (const o of filters.legacyOptions ?? []) {
      if (o.attribute === "competitive") continue;
      expect(toAreas([o.attribute], filters)).toHaveLength(1);
    }
  });

  it("resolves: own area choice > team assignment > legacy translation", () => {
    expect(resolveAreas(["community"], ["sport"], filters)).toEqual(["community"]);
    expect(resolveAreas(["music", "outdoor"], ["community"], filters)).toEqual(["community"]);
    expect(resolveAreas(["music", "outdoor"], undefined, filters)).toEqual(["sport", "culture"]);
    expect(resolveAreas([], undefined, filters)).toEqual([]);
  });

  it("gives every group at most two known areas from data/areas.json", () => {
    const assignments = (areasJson as { assignments: Record<string, { areas: string[] }> }).assignments;
    for (const a of Object.values(assignments)) {
      expect(a.areas.length).toBeGreaterThanOrEqual(1);
      expect(a.areas.length).toBeLessThanOrEqual(MAX_AREAS_PER_GROUP);
      for (const area of a.areas) expect(ids).toContain(area);
    }
  });

  it("only exposes area ids on groups after loading", () => {
    for (const g of getGroups()) for (const f of g.selfRating.filterSelections) expect(ids).toContain(f);
  });
});

describe("?r= links from before the switch to areas", () => {
  it("decodes an 8-digit filter part as the old filters", () => {
    const answers = "1".repeat(items.length);
    // old order: handsOn, arts, competitive, music, outdoor, tech, party, sports
    expect(decodeResults(`${answers}-00011001`, items, filters)?.filters).toEqual(["sport", "culture"]);
    expect(decodeResults(`${answers}-00100000`, items, filters)?.filters).toEqual([]);
  });

  it("round-trips new links", () => {
    const r = encodeResults({}, ["community", "sport"], items, filters);
    expect(r.endsWith(`-${"1" + "0".repeat(ids.length - 2) + "1"}`)).toBe(true);
    expect(decodeResults(r, items, filters)?.filters).toEqual(["sport", "community"]);
  });
});
