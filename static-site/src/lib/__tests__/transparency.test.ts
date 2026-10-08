// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { EXAMPLE, EXAMPLE_SCORE } from "@/components/TransparencyContent";
import { scoreGroup } from "../matching";
import { makeGroup } from "./helpers";

describe("transparency page", () => {
  it("its worked example gives the same result as the real matching", () => {
    const answers = Object.fromEntries(EXAMPLE.map((r, i) => [`WS2-0${i + 1}`, r.you]));
    const group = makeGroup("beispiel", Object.fromEntries(EXAMPLE.map((r, i) => [`WS2-0${i + 1}`, r.group])));
    expect(scoreGroup(answers, [], group)).toBe(EXAMPLE_SCORE);
    expect(EXAMPLE_SCORE).toBe(75);
  });
});
