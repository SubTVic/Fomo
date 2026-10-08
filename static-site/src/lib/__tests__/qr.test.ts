// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { qrMatrix } from "../qr";
import { encodeResults } from "../results";
import { getQuizFilters, getQuizItems } from "../data";
import type { UserAnswers } from "../matching";

describe("QR code of the result link", () => {
  it("encodes a full ?r= link with every filter at a phone-scannable size", () => {
    const items = getQuizItems();
    const quizFilters = getQuizFilters();
    const answers: UserAnswers = {};
    for (const it of items) answers[it.id] = 1;
    const filters = quizFilters.options.map((o) => o.attribute);
    const r = encodeResults(answers, filters, items, quizFilters);
    const url = `https://www.fomo-dresden.app/en/quiz/?r=${r}`;
    const { size, path } = qrMatrix(url);
    // Version 6 (41 modules) or below stays easy to scan off a phone screen.
    expect(size).toBeLessThanOrEqual(41);
    expect(path).toMatch(/^M\d+ \d+h1v1h-1z/);
  });

  it("is deterministic", () => {
    expect(qrMatrix("https://www.fomo-dresden.app/quiz/?r=abc")).toEqual(
      qrMatrix("https://www.fomo-dresden.app/quiz/?r=abc"),
    );
  });
});
