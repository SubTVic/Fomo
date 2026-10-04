// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { getGroups, getMatchableGroups } from "../data";

describe("data layer", () => {
  it("never offers auto-derived (unverified) groups for matching", () => {
    const matchable = getMatchableGroups();
    expect(matchable.length).toBeGreaterThan(0);
    expect(matchable.filter((g) => g.selfRating.derived === true)).toEqual([]);
  });

  it("keeps all non-derived groups matchable", () => {
    const verified = getGroups().filter((g) => g.selfRating.derived !== true);
    expect(getMatchableGroups().map((g) => g.slug)).toEqual(verified.map((g) => g.slug));
  });

  it("has unique slugs", () => {
    const slugs = getGroups().map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
