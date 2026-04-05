// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from "vitest";
import { computeQuizMatches } from "./matching";
import type { QuizThesisData, QuizGroupData } from "./types";

// ─── Test helpers ─────────────────────────────────────────────────

function makeThesis(
  id: string,
  attributes: { attribute: string; isInverse?: boolean }[],
): QuizThesisData {
  return {
    id,
    text: `Thesis ${id}`,
    shortTitle: id,
    hint: null,
    order: 0,
    attributes: attributes.map((a) => ({
      attribute: a.attribute,
      isInverse: a.isInverse ?? false,
    })),
  };
}

function makeGroup(
  id: string,
  attrs: Record<string, boolean>,
): QuizGroupData {
  return {
    id,
    name: `Group ${id}`,
    slug: id,
    shortDescription: "Test group",
    longDescription: null,
    categoryName: "Test",
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

// ─── Tests ────────────────────────────────────────────────────────

describe("computeQuizMatches", () => {
  const thesis = makeThesis("t1", [{ attribute: "career" }]);
  const group = makeGroup("g1", { career: true });

  it("returns 100% when user agrees and group has the attribute", () => {
    const results = computeQuizMatches({ t1: "5" }, [thesis], [group]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(100);
  });

  it("returns 0% when user agrees but group lacks the attribute", () => {
    const g = makeGroup("g2", { career: false });
    const results = computeQuizMatches({ t1: "5" }, [thesis], [g]);
    expect(results[0].score).toBe(0);
  });

  it("returns 100% when user disagrees and group lacks the attribute", () => {
    const g = makeGroup("g2", { career: false });
    const results = computeQuizMatches({ t1: "1" }, [thesis], [g]);
    expect(results[0].score).toBe(100);
  });

  it("returns 50% for all neutral answers (default fallback)", () => {
    const results = computeQuizMatches({ t1: "3" }, [thesis], [group]);
    expect(results[0].score).toBe(50);
  });

  it("skips value '0' (nicht verstanden)", () => {
    const results = computeQuizMatches({ t1: "0" }, [thesis], [group]);
    expect(results[0].score).toBe(50); // No answers → default 50%
  });

  it("skips undefined answers", () => {
    const results = computeQuizMatches({}, [thesis], [group]);
    expect(results[0].score).toBe(50);
  });

  it("handles inverse attribute mappings correctly", () => {
    // Inverse: agreeing (5 → 1.0) means the attribute should NOT be present
    const inverseThesis = makeThesis("t2", [{ attribute: "timeLow", isInverse: true }]);
    const gLow = makeGroup("g1", { timeLow: true });
    const gHigh = makeGroup("g2", { timeLow: false });

    // User agrees → effectiveUser = 1-1.0 = 0.0 → similarity with true(1) = 1-|0-1| = 0
    const results = computeQuizMatches({ t2: "5" }, [inverseThesis], [gLow, gHigh]);
    const lowGroup = results.find((r) => r.group.id === "g1")!;
    const highGroup = results.find((r) => r.group.id === "g2")!;

    expect(lowGroup.score).toBe(0);
    expect(highGroup.score).toBe(100);
  });

  it("handles multiple theses with multiple attribute mappings", () => {
    const theses = [
      makeThesis("t1", [{ attribute: "career" }]),
      makeThesis("t2", [{ attribute: "sports" }]),
      makeThesis("t3", [{ attribute: "arts" }]),
    ];
    const g = makeGroup("g1", { career: true, sports: true, arts: false });

    // Agree on career (match), agree on sports (match), agree on arts (conflict)
    const results = computeQuizMatches(
      { t1: "5", t2: "5", t3: "5" },
      theses,
      [g],
    );

    // 2 matches + 1 conflict out of 3 equal-weighted → ~67%
    expect(results[0].score).toBe(67);
  });

  it("weights extreme answers higher than moderate ones", () => {
    // agree (5) → weight 1.0, moderate-agree (~4) is not a valid answer in 1/3/5 scale
    // With 1/3/5 Likert: only 0 or 1.0 weights are possible (no in-between)
    const theses = [
      makeThesis("t1", [{ attribute: "career" }]),
      makeThesis("t2", [{ attribute: "sports" }]),
    ];
    const g = makeGroup("g1", { career: true, sports: false });

    // Agree on career (match), neutral on sports (skipped)
    const results = computeQuizMatches({ t1: "5", t2: "3" }, theses, [g]);
    expect(results[0].score).toBe(100); // Only career counts, sports skipped
  });

  it("sorts results by score descending", () => {
    const theses = [makeThesis("t1", [{ attribute: "career" }])];
    const groups = [
      makeGroup("g1", { career: false }),
      makeGroup("g2", { career: true }),
    ];

    const results = computeQuizMatches({ t1: "5" }, theses, groups);
    expect(results[0].group.id).toBe("g2");
    expect(results[1].group.id).toBe("g1");
  });

  it("classifies attribute matches as match/partial/conflict", () => {
    const results = computeQuizMatches({ t1: "5" }, [thesis], [group]);
    const attr = results[0].attributeMatches[0];

    expect(attr.attribute).toBe("career");
    expect(attr.groupHas).toBe(true);
    expect(attr.userAgrees).toBe(true);
    expect(attr.category).toBe("match");
    expect(attr.similarity).toBe(1);
  });

  it("marks conflicts correctly", () => {
    const g = makeGroup("g1", { career: false });
    const results = computeQuizMatches({ t1: "5" }, [thesis], [g]);
    const attr = results[0].attributeMatches[0];

    expect(attr.category).toBe("conflict");
    expect(attr.similarity).toBe(0);
  });

  it("handles thesis with attribute not in group (undefined)", () => {
    const t = makeThesis("t1", [{ attribute: "nonexistent" }]);
    const results = computeQuizMatches({ t1: "5" }, [t], [group]);
    // Attribute not on group → skipped, default 50%
    expect(results[0].score).toBe(50);
  });

  it("handles multiple groups and ranks them", () => {
    const theses = [
      makeThesis("t1", [{ attribute: "career" }]),
      makeThesis("t2", [{ attribute: "sports" }]),
    ];
    const groups = [
      makeGroup("perfect", { career: true, sports: true }),
      makeGroup("half", { career: true, sports: false }),
      makeGroup("none", { career: false, sports: false }),
    ];

    const results = computeQuizMatches(
      { t1: "5", t2: "5" },
      theses,
      groups,
    );

    expect(results[0].group.id).toBe("perfect");
    expect(results[0].score).toBe(100);
    expect(results[1].group.id).toBe("half");
    expect(results[1].score).toBe(50);
    expect(results[2].group.id).toBe("none");
    expect(results[2].score).toBe(0);
  });
});
