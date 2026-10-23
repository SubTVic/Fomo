// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { FOCUS_MS, RECHARGE_MS, TARGET, shuffled, taskInitial, taskReducer } from "@/components/quiz/FokusTaskGame";
import { COLLECTIONS, COLLECTION_MEMBERS, DISTRACTIONS, SPECIAL, completedBy } from "@/lib/fokus-notifications";

const start = () => taskReducer(taskInitial, { type: "start", now: 0, shuffle: Array.from({ length: TARGET }, (_, i) => (i * 0.37) % 1) });
const tick = (s: ReturnType<typeof start>, now: number) => taskReducer(s, { type: "tick", now, r1: 0.1, r2: 0.5, r3: 0.4 });
const cellOf = (s: ReturnType<typeof start>, value: number) => s.grid.indexOf(value);

describe("FOKUS task game (prototype)", () => {
  it("shuffles all numbers 1…TARGET", () => {
    expect([...shuffled(Array.from({ length: TARGET }, () => 0.5))].sort((a, b) => a - b)).toEqual(
      Array.from({ length: TARGET }, (_, i) => i + 1),
    );
  });

  it("advances only on the right number, flags wrong taps", () => {
    let s = start();
    s = taskReducer(s, { type: "cell", cell: cellOf(s, 2), now: 100 });
    expect(s.next).toBe(1);
    expect(s.wrong).not.toBeNull();
    s = taskReducer(s, { type: "cell", cell: cellOf(s, 1), now: 200 });
    expect(s.next).toBe(2);
  });

  it("is won after tapping 1…TARGET, with the time", () => {
    let s = start();
    for (let v = 1; v <= TARGET; v++) s = taskReducer(s, { type: "cell", cell: cellOf(s, v), now: v * 1_000 });
    expect(s.phase).toBe("won");
    expect(s.timeMs).toBe(TARGET * 1_000);
    expect(s.best).toBe(TARGET * 1_000);
  });

  it("distractions keep coming until the tag blocks them for a while, then it recharges", () => {
    let s = start();
    for (let t = 100; t <= 6_000; t += 100) s = tick(s, t);
    expect(s.notes.filter((n) => n.leftAt === undefined).length).toBeGreaterThan(0);
    s = taskReducer(s, { type: "tag", now: 6_000 });
    expect(s.notes.every((n) => n.leftAt !== undefined)).toBe(true); // all cleared
    for (let t = 6_100; t < 6_000 + FOCUS_MS; t += 100) s = tick(s, t);
    expect(s.notes.filter((n) => n.leftAt === undefined).length).toBe(0); // quiet during focus mode
    expect(taskReducer(s, { type: "tag", now: 6_000 + FOCUS_MS + 1_000 }).focusUses).toBe(1); // still recharging
    expect(taskReducer(s, { type: "tag", now: 6_000 + FOCUS_MS + RECHARGE_MS }).focusUses).toBe(2);
  });

  it("counts the notifications dismissed by hand", () => {
    let s = start();
    for (let t = 100; t <= 6_000; t += 100) s = tick(s, t);
    const live = s.notes.filter((n) => n.leftAt === undefined);
    for (const n of live) s = taskReducer(s, { type: "dismiss", id: n.id, now: 6_100 });
    s = taskReducer(s, { type: "dismiss", id: live[0].id, now: 6_200 }); // twice doesn't count
    expect(s.dismissed).toBe(live.length);
  });

  it("only uses the special (non-generic) messages, rare ones included", () => {
    let s = start();
    const shown = new Set<number>();
    for (let t = 100; t <= 60_000; t += 100) {
      const r = Math.abs(Math.sin(t * 12.9898) * 43758.5453) % 1; // well-spread pseudo-random
      s = taskReducer(s, { type: "tick", now: t, r1: r, r2: 0.5, r3: 0.4 });
      for (const n of s.notes) shown.add(n.idx);
      s = { ...s, notes: [] }; // keep room for new ones
    }
    expect([...shown].every((i) => !DISTRACTIONS[i].generic)).toBe(true);
    expect([...shown].some((i) => DISTRACTIONS[i].tier === 3)).toBe(true);
  });
});

describe("notification collections", () => {
  it("puts every special message into at least one collection, and only those", () => {
    for (const i of SPECIAL) {
      const homes = COLLECTIONS.filter((col) => COLLECTION_MEMBERS[col.id].includes(i));
      expect(homes.length, DISTRACTIONS[i].text.de).toBeGreaterThan(0);
    }
    for (const col of COLLECTIONS) {
      expect(COLLECTION_MEMBERS[col.id].length, col.id).toBeGreaterThanOrEqual(4);
      for (const i of COLLECTION_MEMBERS[col.id]) expect(DISTRACTIONS[i].generic).toBeFalsy();
    }
  });

  it("reports a collection as complete exactly when its last message is found", () => {
    const ex = COLLECTION_MEMBERS.ex;
    const last = ex[ex.length - 1];
    expect(completedBy(ex.slice(0, -2), last)).toEqual([]);
    expect(completedBy(ex.slice(0, -1), last)).toEqual(["ex"]);
    expect(completedBy(ex, last)).toEqual([]); // already had it
  });

  it("carries earlier finds into the next round and shows new messages first", () => {
    const found = SPECIAL.slice(0, SPECIAL.length - 3);
    let s = taskReducer(taskInitial, { type: "start", now: 0, shuffle: [], found });
    const shown: { idx: number; fresh: boolean }[] = [];
    for (let t = 100; t <= 8_000; t += 100) {
      s = taskReducer(s, { type: "tick", now: t, r1: (t * 0.37) % 1, r2: 0, r3: 0 });
      for (const n of s.notes) if (!shown.some((x) => x.idx === n.idx)) shown.push({ idx: n.idx, fresh: n.fresh });
      for (const n of s.notes) s = taskReducer(s, { type: "dismiss", id: n.id, now: t });
    }
    // the three unseen ones come first, flagged as new
    expect(shown.slice(0, 3).every((x) => x.fresh && !found.includes(x.idx))).toBe(true);
    expect(shown.slice(3).every((x) => !x.fresh)).toBe(true);
  });

  it("announces a collection completed during the round", () => {
    const ex = COLLECTION_MEMBERS.ex;
    const found = SPECIAL.filter((i) => i !== ex[0]);
    let s = taskReducer(taskInitial, { type: "start", now: 0, shuffle: [], found });
    s = taskReducer(s, { type: "tick", now: 2_000, r1: 0, r2: 0, r3: 0 });
    expect(s.notes[0].idx).toBe(ex[0]);
    expect(s.unlocked.map((u) => u.id)).toContain("ex");
  });
});
