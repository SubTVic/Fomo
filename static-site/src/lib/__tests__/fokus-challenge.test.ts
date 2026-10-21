// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { elapsed, initial, reducer } from "@/components/quiz/FokusChallenge";

const tick = (s: ReturnType<typeof reducer>, now: number) => reducer(s, { type: "tick", now, r1: 0.9, r2: 0.5 });

describe("Fokus mini game", () => {
  it("freezes the round clock while focus mode runs", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = tick(s, 4_000);
    s = reducer({ ...s, charge: 5 }, { type: "tag", now: 4_000 });
    expect(elapsed(s, 4_000)).toBe(4_000);
    expect(elapsed(s, 5_500)).toBe(4_000); // still paused
    expect(elapsed(s, 7_500)).toBe(5_000); // 2.5 s pause excluded
  });

  it("does not spawn during focus mode", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = reducer({ ...s, charge: 5 }, { type: "tag", now: 1_000 });
    const before = s.notes.length;
    for (let t = 1_100; t < 3_400; t += 100) s = tick(s, t);
    expect(s.notes.filter((n) => n.leftAt === undefined).length).toBe(before);
  });

  it("fires a burst of several notifications at once", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    // keep the screen empty so only the burst counts
    for (let t = 100; t < 8_000; t += 100) s = { ...tick(s, t), notes: [] };
    s = tick(s, 8_000);
    expect(s.burstsDone).toBe(1);
    expect(s.notes.length).toBeGreaterThanOrEqual(3);
  });

  it("is lost when a notification has no free slot", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    for (let t = 100; t <= 8_000 && s.phase === "playing"; t += 100) s = tick(s, t);
    expect(s.phase).toBe("lost");
  });
});
