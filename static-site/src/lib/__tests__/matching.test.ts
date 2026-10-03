// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { computeMatches, scoreGroup, topWithTies, type UserAnswers } from "../matching";
import { getMatchableGroups, getQuizFilters, getQuizItems } from "../data";
import type { MatchResult } from "../types";
import { makeGroup, mulberry32 } from "./helpers";

describe("scoreGroup", () => {
  it("treats filters as a hard constraint (no overlap → score 0)", () => {
    const group = makeGroup("g", { A: 1 }, ["music"]);
    expect(scoreGroup({ A: 1 }, ["sports"], group)).toBe(0);
    expect(scoreGroup({ A: 1 }, ["sports", "music"], group)).toBe(100);
  });

  it("does not exclude groups without filter data, or users without filters", () => {
    expect(scoreGroup({ A: 1 }, ["sports"], makeGroup("g", { A: 1 }))).toBe(100);
    expect(scoreGroup({ A: 1 }, [], makeGroup("g", { A: 1 }, ["music"]))).toBe(100);
  });

  it("ignores neutral answers", () => {
    const group = makeGroup("g", { A: 1, B: -1 });
    // B is neutral for the user → only A counts → perfect match.
    expect(scoreGroup({ A: 1, B: 0 }, [], group)).toBe(100);
    // Opposite answer on the only active item → 0.
    expect(scoreGroup({ A: -1, B: 0 }, [], group)).toBe(0);
  });

  it("returns 50 when the user has no active answers", () => {
    expect(scoreGroup({ A: 0, B: 0 }, [], makeGroup("g", { A: 1 }))).toBe(50);
  });

  it("treats items the group never rated as neutral (0)", () => {
    // |1 - 0| = 1 of max 2 → 50
    expect(scoreGroup({ A: 1 }, [], makeGroup("g", {}))).toBe(50);
  });

  it("always stays within 0–100 for real data and random profiles", () => {
    const items = getQuizItems();
    const filters = getQuizFilters().options.map((o) => o.attribute);
    const groups = getMatchableGroups();
    const rand = mulberry32(42);
    for (let n = 0; n < 300; n++) {
      const answers: UserAnswers = {};
      for (const it of items) answers[it.id] = Math.floor(rand() * 3) - 1;
      const userFilters = filters.filter(() => rand() < 0.2);
      for (const g of groups) {
        const s = scoreGroup(answers, userFilters, g);
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("computeMatches", () => {
  it("sorts best-first by unrounded fit", () => {
    const groups = [
      makeGroup("worse", { A: 1, B: 1, C: -1 }),
      makeGroup("best", { A: 1, B: 1, C: 1 }),
      makeGroup("mid", { A: 1, B: 0, C: 1 }),
    ];
    const order = computeMatches({ A: 1, B: 1, C: 1 }, [], groups).map((m) => m.group.slug);
    expect(order).toEqual(["best", "mid", "worse"]);
  });

  it("breaks genuine ties deterministically for the same answers", () => {
    const groups = ["a", "b", "c", "d", "e", "f"].map((s) => makeGroup(s, { A: 1 }));
    const answers = { A: 1, B: 0 };
    const first = computeMatches(answers, [], groups).map((m) => m.group.slug);
    const second = computeMatches(answers, [], [...groups].reverse()).map((m) => m.group.slug);
    expect(second).toEqual(first);
  });

  it("varies the tie order across different users", () => {
    const groups = Array.from({ length: 8 }, (_, i) => makeGroup(`g${i}`, {}));
    const orders = new Set<string>();
    for (const v of [-1, 1]) {
      for (const item of ["A", "B", "C", "D", "E"]) {
        orders.add(computeMatches({ [item]: v }, [], groups).map((m) => m.group.slug).join(","));
      }
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it("prefers an explicit filter match at a genuine tie", () => {
    const groups = [makeGroup("no-filters", { A: 1 }), makeGroup("shares-filter", { A: 1 }, ["music"])];
    const profiles: UserAnswers[] = [{ A: 1 }, { A: 1, B: 1 }, { A: 1, C: -1 }];
    for (const v of profiles) {
      expect(computeMatches(v, ["music"], groups)[0].group.slug).toBe("shares-filter");
    }
  });
});

describe("topWithTies", () => {
  const result = (slug: string, score: number): MatchResult => ({ group: makeGroup(slug, {}), score });

  it("returns the top 5 when there is no tie at the boundary", () => {
    const matches = [90, 80, 70, 60, 50, 40, 30].map((s, i) => result(`g${i}`, s));
    expect(topWithTies(matches).map((m) => m.score)).toEqual([90, 80, 70, 60, 50]);
  });

  it("includes all groups tied with the 5th, capped at 10", () => {
    const tied = [90, 80, 70, 60, 50, 50, 50, 40].map((s, i) => result(`g${i}`, s));
    expect(topWithTies(tied).map((m) => m.score)).toEqual([90, 80, 70, 60, 50, 50, 50]);
    const many = [90, 80, 70, 60, ...Array(12).fill(50)].map((s, i) => result(`g${i}`, s));
    expect(topWithTies(many)).toHaveLength(10);
  });

  it("drops groups with score 0", () => {
    const matches = [80, 0, 0].map((s, i) => result(`g${i}`, s));
    expect(topWithTies(matches).map((m) => m.score)).toEqual([80]);
  });
});
