// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { diffSnapshots, fieldLabel, planRevert, type Snapshot } from "@/lib/change-log";

const before: Snapshot = {
  shortDescription: "Alt",
  websiteUrl: null,
  isVerified: true,
  selfRating: true,
  "selfRating.filterSelections": ["music"],
  "selfRating.answers.WS2-01": 1,
  "selfRating.answers.WS2-02": 0,
};

describe("diffSnapshots", () => {
  it("returns only changed fields with from/to", () => {
    const after = { ...before, shortDescription: "Neu", websiteUrl: "https://example.org" };
    expect(diffSnapshots(before, after)).toEqual({
      shortDescription: { from: "Alt", to: "Neu" },
      websiteUrl: { from: null, to: "https://example.org" },
    });
  });

  it("is empty when nothing changed (arrays compared by value)", () => {
    expect(diffSnapshots(before, { ...before, "selfRating.filterSelections": ["music"] })).toEqual({});
  });

  it("treats added and removed keys as changes from/to null", () => {
    const after: Snapshot = { ...before, "selfRating.answers.WS2-03": -1 };
    delete after["selfRating.answers.WS2-02"];
    expect(diffSnapshots(before, after)).toEqual({
      "selfRating.answers.WS2-02": { from: 0, to: null },
      "selfRating.answers.WS2-03": { from: null, to: -1 },
    });
  });
});

describe("planRevert", () => {
  const changes = {
    shortDescription: { from: "Alt", to: "Neu" },
    "selfRating.answers.WS2-01": { from: 1, to: -1 },
  };

  it("resets fields that still hold the changed value", () => {
    const current = { ...before, shortDescription: "Neu", "selfRating.answers.WS2-01": -1 };
    expect(planRevert(changes, current)).toEqual({
      values: { shortDescription: "Alt", "selfRating.answers.WS2-01": 1 },
      skipped: [],
    });
  });

  it("skips fields that were changed again since", () => {
    const current = { ...before, shortDescription: "Noch neuer", "selfRating.answers.WS2-01": -1 };
    expect(planRevert(changes, current)).toEqual({
      values: { "selfRating.answers.WS2-01": 1 },
      skipped: ["shortDescription"],
    });
  });

  it("ignores fields that are already back at the old value", () => {
    const current = { ...before, shortDescription: "Alt", "selfRating.answers.WS2-01": 1 };
    expect(planRevert(changes, current)).toEqual({ values: {}, skipped: [] });
  });
});

describe("fieldLabel", () => {
  it("labels answers and known fields in German", () => {
    expect(fieldLabel("selfRating.answers.WS2-07")).toBe("Antwort WS2-07");
    expect(fieldLabel("shortDescription")).toBe("Kurzbeschreibung");
    expect(fieldLabel("unknownField")).toBe("unknownField");
  });
});
