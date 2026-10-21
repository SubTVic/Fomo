// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { elapsed, initial, reducer, spawnGap } from "@/components/quiz/FokusChallenge";
import { DISTRACTIONS, pickDistraction } from "@/lib/fokus-notifications";

const tick = (s: ReturnType<typeof reducer>, now: number) => reducer(s, { type: "tick", now, r1: 0.9, r2: 0.5, r3: 0.3, r4: 0.7 });

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

  it("has no time limit: survives past 30 s while the screen is kept clear", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    for (let t = 100; t <= 60_000; t += 100) s = { ...tick(s, t), notes: [] };
    expect(s.phase).toBe("playing");
    expect(s.burstsDone).toBe(7); // one every 8 s
  });

  it("speeds up, then levels off at a holdable pace", () => {
    expect(spawnGap(0)).toBe(950);
    expect(spawnGap(30_000)).toBeLessThan(600);
    // after a minute it barely changes …
    expect(spawnGap(60_000) - spawnGap(90_000)).toBeLessThan(40);
    // … and never drops below 0.42 s (≈2.4 per second)
    expect(spawnGap(600_000)).toBe(420);
    for (let t = 0; t < 600_000; t += 1_000) expect(spawnGap(t + 1_000)).toBeLessThanOrEqual(spawnGap(t));
  });

  it("costs 5 points to tap away your own group", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = { ...s, score: 10, notes: [{ id: 99, kind: "good", idx: 0, born: 0, slot: 0 }] };
    s = reducer(s, { type: "tap", id: 99, now: 100 });
    expect(s.score).toBe(5);
  });

  it("paralyses you after tapping your group: no taps or tag, spawns go on", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = {
      ...s,
      charge: 5,
      notes: [
        { id: 1, kind: "good", idx: 0, born: 0, slot: 0 },
        { id: 2, kind: "bad", idx: 0, born: 0, slot: 1 },
      ],
    };
    s = reducer(s, { type: "tap", id: 1, now: 1_000 });
    const stunned = reducer(s, { type: "tap", id: 2, now: 1_400 });
    expect(stunned.blocked).toBe(0); // tap ignored
    expect(reducer(s, { type: "tag", now: 1_400 }).charge).toBe(5); // tag ignored
    const later = tick(s, 2_000);
    expect(later.notes.filter((n) => n.leftAt === undefined).length).toBeGreaterThan(1); // spawning continues
    expect(reducer(s, { type: "tap", id: 2, now: 2_600 }).blocked).toBe(1); // works again after 1.5 s
  });

  it("runs the hands-on tutorial, then starts the round", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: true });
    s = tick(s, 600);
    expect(s.phase).toBe("tutorial");
    s = reducer(s, { type: "tap", id: s.notes[0].id, now: 700 }); // step 0: block it
    s = tick(s, 800);
    s = tick(s, 1_500); // step 1: group message appears …
    expect(s.notes.some((n) => n.kind === "good" && n.leftAt === undefined)).toBe(true);
    for (let t = 1_600; t <= 5_000; t += 100) s = tick(s, t); // … and is left alone (+2)
    for (let t = 5_100; t <= 6_000 && s.tutStep === 2 && !s.tutSpawned; t += 100) s = tick(s, t);
    expect(s.charge).toBe(5); // step 2: tag is charged for the three notes
    s = reducer(s, { type: "tag", now: 6_100 });
    s = tick(s, 6_200);
    expect(s.phase).toBe("playing");
  });

  it("is lost when a notification has no free slot", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    for (let t = 100; t <= 8_000 && s.phase === "playing"; t += 100) s = tick(s, t);
    expect(s.phase).toBe("lost");
    expect(s.survivedMs).toBeGreaterThan(0);
  });

  it("unlocks rarer messages the longer you play, preferring unseen ones", () => {
    const tierAt = (ms: number) =>
      new Set(Array.from({ length: 200 }, (_, i) => DISTRACTIONS[pickDistraction(ms, [], i / 200, 0.5)].tier));
    expect([...tierAt(5_000)]).toEqual([0]);
    expect(tierAt(20_000).has(1)).toBe(true);
    expect(tierAt(20_000).has(2)).toBe(false);
    expect(tierAt(80_000).has(3)).toBe(true);
    // with all but one tier-0 message seen, the unseen one comes next
    const tier0 = DISTRACTIONS.map((_, i) => i).filter((i) => DISTRACTIONS[i].tier === 0);
    const seen = tier0.slice(0, -1);
    expect(pickDistraction(1_000, seen, 0, 0.99)).toBe(tier0[tier0.length - 1]);
  });
});
