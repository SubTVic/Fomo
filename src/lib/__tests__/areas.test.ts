// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { AREA_IDS, isValidAreaSelection, resolveAreas } from "../areas";

describe("areas (admin app)", () => {
  it("has the 5 areas of the public quiz", () => {
    expect(AREA_IDS).toEqual(["sport", "culture", "projects", "engagement", "community"]);
  });

  it("resolves own areas first, then the old activity filters", () => {
    expect(resolveAreas(["community", "outdoor"], null)).toEqual(["community"]);
    expect(resolveAreas(["music", "arts", "sports", "competitive"], null)).toEqual(["sport", "culture"]);
    expect(resolveAreas(null, null)).toEqual([]);
  });

  it("accepts 1–2 known, distinct areas only", () => {
    expect(isValidAreaSelection(["sport"])).toBe(true);
    expect(isValidAreaSelection(["sport", "community"])).toBe(true);
    expect(isValidAreaSelection([])).toBe(false);
    expect(isValidAreaSelection(["sport", "culture", "projects"])).toBe(false);
    expect(isValidAreaSelection(["sport", "sport"])).toBe(false);
    expect(isValidAreaSelection(["music"])).toBe(false);
  });
});
