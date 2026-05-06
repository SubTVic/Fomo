// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from "vitest";
import { computeQuizMatches, computeItemCountsPerAttribute } from "../matching";
import type { QuizThesisData, QuizGroupData } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeGroup(id: string, attrs: Record<string, boolean>): QuizGroupData {
  return {
    id,
    name: id,
    slug: id,
    shortDescription: "",
    longDescription: null,
    categoryName: "",
    websiteUrl: null,
    instagramUrl: null,
    contactEmail: null,
    attributes: attrs,
    nextEventTitle: null,
    nextEventDate: null,
    nextEventTime: null,
    nextEventLocation: null,
    nextEventUrl: null,
    nextEventIsOpen: false,
  };
}

function makeThesis(id: string, attribute: string, isInverse = false): QuizThesisData {
  return { id, text: id, shortTitle: id, hint: null, order: 0, attributes: [{ attribute, isInverse }] };
}

// ─── Track A1: Multi-Item-Normalisierung ─────────────────────────────────────

describe("computeItemCountsPerAttribute", () => {
  it("counts single-mapping theses correctly", () => {
    const theses = [
      makeThesis("T1", "socialImpact"),
      makeThesis("T2", "networking"),
    ];
    expect(computeItemCountsPerAttribute(theses)).toEqual({ socialImpact: 1, networking: 1 });
  });

  it("counts multiple theses mapping to the same attribute", () => {
    const theses = [
      makeThesis("T1", "socialImpact"),
      makeThesis("T2", "socialImpact"),
      makeThesis("T3", "socialImpact"),
    ];
    expect(computeItemCountsPerAttribute(theses)).toEqual({ socialImpact: 3 });
  });

  it("returns empty object for empty thesis list", () => {
    expect(computeItemCountsPerAttribute([])).toEqual({});
  });
});

describe("computeQuizMatches — A1 multi-item normalization", () => {
  // Two groups: one has socialImpact=true, one has socialImpact=false.
  // User agrees strongly on all socialImpact items.
  // With normalization, 3 items on the same attribute should behave like 1 item.
  it("3 items on socialImpact produce same spread as 1 item (normalization test)", () => {
    const groups = [
      makeGroup("g-yes", { socialImpact: true }),
      makeGroup("g-no", { socialImpact: false }),
    ];

    // Scenario A: 3 items on socialImpact
    const theses3 = [
      makeThesis("T1", "socialImpact"),
      makeThesis("T2", "socialImpact"),
      makeThesis("T3", "socialImpact"),
    ];
    const answers3 = { T1: "5", T2: "5", T3: "5" };

    // Scenario B: 1 item on socialImpact
    const theses1 = [makeThesis("T1", "socialImpact")];
    const answers1 = { T1: "5" };

    const results3 = computeQuizMatches(answers3, theses3, groups);
    const results1 = computeQuizMatches(answers1, theses1, groups);

    const score3Yes = results3.find((r) => r.group.id === "g-yes")!.score;
    const score1Yes = results1.find((r) => r.group.id === "g-yes")!.score;
    const score3No = results3.find((r) => r.group.id === "g-no")!.score;
    const score1No = results1.find((r) => r.group.id === "g-no")!.score;

    expect(score3Yes).toBe(score1Yes);
    expect(score3No).toBe(score1No);
  });

  it("single-item mappings are unaffected by the normalization", () => {
    const groups = [
      makeGroup("g-a", { networking: true, arts: false }),
      makeGroup("g-b", { networking: false, arts: true }),
    ];
    const theses = [
      makeThesis("T1", "networking"),
      makeThesis("T2", "arts"),
    ];
    const answersAgreeNet = { T1: "5", T2: "1" };

    const results = computeQuizMatches(answersAgreeNet, theses, groups);
    const gA = results.find((r) => r.group.id === "g-a")!;
    const gB = results.find((r) => r.group.id === "g-b")!;

    // g-a matches on both items, g-b conflicts on both — g-a should be first
    expect(gA.score).toBeGreaterThan(gB.score);
  });

  it("does not crash when a thesis maps to an attribute absent in group profiles", () => {
    const groups = [makeGroup("g1", { networking: true })];
    const theses = [
      makeThesis("T1", "networking"),
      makeThesis("T2", "unknownAttr"), // not in group profile
    ];
    const answers = { T1: "5", T2: "5" };

    expect(() => computeQuizMatches(answers, theses, groups)).not.toThrow();
  });

  it("ranking order is preserved: top match ranked first", () => {
    const groups = [
      makeGroup("g-match", { competitive: true }),
      makeGroup("g-mismatch", { competitive: false }),
    ];
    const theses = [makeThesis("T1", "competitive")];
    const answers = { T1: "5" }; // strongly agrees → wants competitive

    const results = computeQuizMatches(answers, theses, groups);
    expect(results[0].group.id).toBe("g-match");
  });
});
