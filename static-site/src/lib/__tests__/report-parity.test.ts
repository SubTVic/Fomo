// SPDX-License-Identifier: AGPL-3.0-only
// scripts/report.mjs keeps its own copy of the matching ("KEEP IN SYNC").
// This test makes the sync mechanical: both must rank identically.

import { describe, expect, it } from "vitest";
import { computeMatches, topWithTies, type UserAnswers } from "../matching";
import { getMatchableGroups, getQuizFilters, getQuizItems } from "../data";
import { mulberry32 } from "./helpers";
import { rankAll, topFive } from "../../../scripts/report.mjs";

type ReportRow = { g: { slug: string }; score: number };

describe("report.mjs ↔ live matching parity", () => {
  it("ranks 1,000 random profiles identically", () => {
    const items = getQuizItems();
    const filterIds = getQuizFilters().options.map((o) => o.attribute);
    const groups = getMatchableGroups();
    const rand = mulberry32(2026);

    for (let n = 0; n < 1000; n++) {
      const answers: UserAnswers = {};
      // Mix of mostly-neutral and opinionated profiles.
      const neutralShare = rand();
      for (const it of items) answers[it.id] = rand() < neutralShare ? 0 : rand() < 0.5 ? -1 : 1;
      const filters = filterIds.filter(() => rand() < 0.15);

      const live = computeMatches(answers, filters, groups).filter((m) => m.score > 0);
      const report = rankAll(answers, filters, groups) as ReportRow[];
      expect(report.map((r) => `${r.g.slug}:${r.score}`)).toEqual(
        live.map((m) => `${m.group.slug}:${m.score}`),
      );

      const liveTop = topWithTies(computeMatches(answers, filters, groups)).map((m) => m.group.slug);
      const reportTop = (topFive(answers, filters, groups) as ReportRow[]).map((r) => r.g.slug);
      expect(reportTop).toEqual(liveTop);
    }
  });
});
