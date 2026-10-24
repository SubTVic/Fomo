// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { CHARGE_FULL, CHARGE_STEP, chargeNeeded, elapsed, initial, reducer, spawnGap } from "@/components/quiz/FokusChallenge";
import { DISTRACTIONS, pickDistraction } from "@/lib/fokus-notifications";

const tick = (s: ReturnType<typeof reducer>, now: number) => reducer(s, { type: "tick", now, r1: 0.9, r2: 0.5, r3: 0.3, r4: 0.7 });

describe("Fokus mini game", () => {
  it("freezes the round clock while focus mode runs", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = tick(s, 4_000);
    s = reducer({ ...s, charge: CHARGE_FULL }, { type: "tag", now: 4_000 });
    expect(elapsed(s, 4_000)).toBe(4_000);
    expect(elapsed(s, 9_000)).toBe(4_000); // still paused (breathing)
    expect(elapsed(s, 14_800)).toBe(5_000); // 9.8 s pause excluded
  });

  it("does not spawn during focus mode", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = reducer({ ...s, charge: CHARGE_FULL }, { type: "tag", now: 1_000 });
    const before = s.notes.length;
    for (let t = 1_100; t < 10_000; t += 100) s = tick(s, t);
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

  it("paralyses you after tapping your group: no taps, spawns go on", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = {
      ...s,
      charge: CHARGE_FULL,
      notes: [
        { id: 1, kind: "good", idx: 0, born: 0, slot: 0 },
        { id: 2, kind: "bad", idx: 0, born: 0, slot: 1 },
      ],
    };
    s = reducer(s, { type: "tap", id: 1, now: 1_000 });
    const stunned = reducer(s, { type: "tap", id: 2, now: 1_400 });
    expect(stunned.blocked).toBe(0); // tap ignored
    // the charged tag is the way out: it works while stunned and ends the stun
    const rescued = reducer(s, { type: "tag", now: 1_400 });
    expect(rescued.charge).toBe(0);
    expect(rescued.stunnedUntil).toBe(0);
    const later = tick(s, 2_000);
    expect(later.notes.filter((n) => n.leftAt === undefined).length).toBeGreaterThan(1); // spawning continues
    expect(reducer(s, { type: "tap", id: 2, now: 2_600 }).blocked).toBe(1); // works again after 1.5 s
  });

  it("runs the tutorial as FOKUS notifications, then starts the round", () => {
    const active = (st: ReturnType<typeof reducer>) => st.notes.filter((n) => n.leftAt === undefined);
    const until = (st: ReturnType<typeof reducer>, from: number, ok: (x: ReturnType<typeof reducer>) => boolean) => {
      for (let t = from; t < from + 10_000 && !ok(st); t += 100) st = tick(st, t);
      return st;
    };
    let s = reducer(initial, { type: "boot", now: 0, tutorial: true });
    s = tick(s, 600);
    expect(active(s).map((n) => n.tip)).toEqual(["tutTap"]); // step 0: the tip itself is what you swipe
    s = reducer(s, { type: "tap", id: active(s)[0].id, now: 700 });
    s = until(s, 800, (x) => x.tutStep === 1 && x.tutSpawned);
    const tip1 = active(s).find((n) => n.tip === "tutGroup");
    expect(active(s).some((n) => n.kind === "good")).toBe(true); // step 1: tip + group message
    s = reducer(s, { type: "tap", id: tip1!.id, now: s.now + 50 });
    s = until(s, s.now + 100, (x) => x.tutStep === 2 && x.tutSpawned); // group message expires on its own
    for (const n of active(s)) s = reducer(s, { type: "tap", id: n.id, now: s.now + 10 }); // step 2: 3 swipes charge it
    expect(s.charge).toBe(CHARGE_FULL);
    s = until(s, s.now + 100, (x) => x.tutStep === 3 && x.tutSpawned);
    expect(active(s).length).toBe(5); // step 3: a full screen — clear it with the tag
    s = reducer(s, { type: "tag", now: s.now + 50 });
    expect(active(s).length).toBe(0);
    s = tick(s, s.now + 100);
    expect(s.phase).toBe("tutorial"); // the focus pause plays …
    s = tick(s, s.now + 10_000);
    expect(s.phase).toBe("playing"); // … then the round starts
  });

  it("is lost when a notification has no free slot", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    for (let t = 100; t <= 8_000 && s.phase === "playing"; t += 100) s = tick(s, t);
    expect(s.phase).toBe("lost"); // full screen ends the round, no rescue
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

  it("the tag charges slowly but clears for double points", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = {
      ...s,
      charge: CHARGE_FULL - 1,
      notes: [0, 1, 2].map((slot) => ({ id: slot + 1, kind: "bad" as const, idx: 0, born: 0, slot })),
    };
    expect(reducer(s, { type: "tag", now: 100 }).score).toBe(0); // not charged yet
    s = reducer(s, { type: "tap", id: 1, now: 100 }); // +1, now charged
    s = reducer(s, { type: "tag", now: 200 });
    expect(s.score).toBe(1 + 2 * 2); // two left on screen, ×2
  });

  it("each tag use makes the next charge take longer", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    expect(chargeNeeded(s)).toBe(CHARGE_FULL);
    s = reducer({ ...s, charge: CHARGE_FULL }, { type: "tag", now: 100 });
    expect(chargeNeeded(s)).toBe(CHARGE_FULL + CHARGE_STEP);
    // 12 is no longer enough …
    expect(reducer({ ...s, charge: CHARGE_FULL, calmUntil: 0 }, { type: "tag", now: 20_000 }).tagUses).toBe(1);
    // … 16 is
    s = reducer({ ...s, charge: CHARGE_FULL + CHARGE_STEP }, { type: "tag", now: 20_000 });
    expect(chargeNeeded(s)).toBe(CHARGE_FULL + 2 * CHARGE_STEP);
  });

  it("announces the moment the tag is ready", () => {
    let s = reducer(initial, { type: "boot", now: 0, tutorial: false });
    s = { ...s, charge: CHARGE_FULL - 1, notes: [{ id: 1, kind: "bad" as const, idx: 0, born: 0, slot: 0 }] };
    s = reducer(s, { type: "tap", id: 1, now: 500 });
    expect(s.flash?.text).toBe("ready");
  });

  it("tutorial tag step: notifications are locked, only the tag moves on", () => {
    let s = { ...reducer(initial, { type: "boot", now: 0, tutorial: true }), tutStep: 3 as const, tutSpawned: true };
    s = { ...s, charge: CHARGE_FULL, notes: [{ id: 1, kind: "bad" as const, idx: 0, born: 0, slot: 0 }] };
    expect(reducer(s, { type: "tap", id: 1, now: 100 }).notes[0].leftAt).toBeUndefined();
    expect(reducer(s, { type: "tag", now: 100 }).notes[0].leftAt).toBe(100);
  });
});
