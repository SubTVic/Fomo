// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { decodeResults, encodeResults } from "../results";
import { getQuizFilters, getQuizItems } from "../data";
import type { UserAnswers } from "../matching";
import { mulberry32 } from "./helpers";

const items = getQuizItems();
const quizFilters = getQuizFilters();

describe("share links (?r=)", () => {
  it("round-trips answers and filters", () => {
    const rand = mulberry32(7);
    for (let n = 0; n < 100; n++) {
      const answers: UserAnswers = {};
      for (const it of items) answers[it.id] = Math.floor(rand() * 3) - 1;
      const filters = quizFilters.options.map((o) => o.attribute).filter(() => rand() < 0.3);
      const r = encodeResults(answers, filters, items, quizFilters);
      expect(decodeResults(r, items, quizFilters)).toEqual({ answers, filters });
    }
  });

  it("keeps the established format: one digit per item, one bit per filter", () => {
    const answers: UserAnswers = Object.fromEntries(items.map((it) => [it.id, 1]));
    const r = encodeResults(answers, [quizFilters.options[0].attribute], items, quizFilters);
    expect(r).toBe(`${"2".repeat(items.length)}-1${"0".repeat(quizFilters.options.length - 1)}`);
  });

  it("rejects strings of the wrong length or with invalid digits", () => {
    expect(decodeResults("1".repeat(items.length - 1) + "-0", items, quizFilters)).toBeNull();
    expect(decodeResults("1".repeat(items.length + 1), items, quizFilters)).toBeNull();
    expect(decodeResults("3" + "1".repeat(items.length - 1), items, quizFilters)).toBeNull();
    expect(decodeResults("", items, quizFilters)).toBeNull();
  });

  it("treats a missing filter part as no filters", () => {
    expect(decodeResults("1".repeat(items.length), items, quizFilters)?.filters).toEqual([]);
  });
});
