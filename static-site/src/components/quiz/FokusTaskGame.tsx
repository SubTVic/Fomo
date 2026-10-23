// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { track, EVENTS } from "@/lib/analytics";
import {
  COLLECTIONS,
  COLLECTION_MEMBERS,
  DISTRACTIONS,
  SPECIAL,
  VIA,
  completedBy,
  pickSpecial,
  type CollectionId,
} from "@/lib/fokus-notifications";
import { PARTNER_OFFER, TASK_COPY } from "@/lib/partner";
import { FokusDevice } from "./FokusDevice";

type Lang = "de" | "en";

const BLUE = "#182078";
const CREAM = "#fefaf3";

/** The task: tap 1…TARGET in order on a shuffled grid (a "Schulte table",
 *  a classic concentration exercise). Distractions pop up over the grid and
 *  swallow taps until dismissed — the FOKUS tag blocks them for a while. */
export const TARGET = 20;
export const FOCUS_MS = 8_000; // focus mode: no notifications
export const RECHARGE_MS = 10_000; // after focus mode, before the tag works again
const MAX_NOTES = 4;
const TICK_MS = 100;
const LEAVE_MS = 300;
const WRONG_MS = 400;
const UNLOCK_SHOW_MS = 2_600; // "collection complete" banner

/** Distractions get faster the further you get (progress 0…1). */
export function taskSpawnGap(progress: number): number {
  return 1_500 - 850 * progress;
}

/** `fresh`: never seen before (this visit) → gets a "new" badge. */
type Note = { id: number; idx: number; top: number; fresh: boolean; leftAt?: number };
type Phase = "playing" | "won";

export interface TaskState {
  phase: Phase;
  grid: number[]; // numbers 1…TARGET in shuffled cell order
  next: number;
  startedAt: number;
  now: number;
  notes: Note[];
  nextId: number;
  nextSpawnAt: number;
  focusUntil: number;
  readyAt: number; // tag usable from here on
  focusUses: number;
  dismissed: number; // notifications swiped away by hand — the punchline at the end
  seen: number[]; // all found messages, seeded with earlier rounds (collection)
  unlocked: { id: CollectionId; at: number }[]; // collections completed this round
  wrong: { cell: number; at: number } | null;
  timeMs: number;
  best: number; // ms, 0 = none yet
}

type Action =
  | { type: "start"; now: number; shuffle: number[]; found?: number[] }
  | { type: "tick"; now: number; r1: number; r2: number; r3: number }
  | { type: "cell"; cell: number; now: number }
  | { type: "dismiss"; id: number; now: number }
  | { type: "tag"; now: number }
  | { type: "resume"; pausedMs: number }; // after the tutorial was reopened mid-game

export const taskInitial: TaskState = {
  phase: "playing",
  grid: Array.from({ length: TARGET }, (_, i) => i + 1),
  next: 1,
  startedAt: 0,
  now: 0,
  notes: [],
  nextId: 1,
  nextSpawnAt: 0,
  focusUntil: 0,
  readyAt: 0,
  focusUses: 0,
  dismissed: 0,
  seen: [],
  unlocked: [],
  wrong: null,
  timeMs: 0,
  best: 0,
};

const active = (n: Note) => n.leftAt === undefined;

/** Shuffle 1…TARGET with the given random numbers (pure, testable). */
export function shuffled(rand: number[]): number[] {
  const a = Array.from({ length: TARGET }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((rand[i] ?? 0) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function taskReducer(s: TaskState, a: Action): TaskState {
  switch (a.type) {
    case "start":
      return {
        ...taskInitial,
        best: s.best,
        nextId: s.nextId,
        grid: shuffled(a.shuffle),
        seen: [...(a.found ?? [])],
        startedAt: a.now,
        now: a.now,
        nextSpawnAt: a.now + 1_800, // a calm first moment to see the task
      };

    case "tick": {
      if (s.phase !== "playing") return { ...s, now: a.now };
      const now = a.now;
      let notes = s.notes.filter((n) => active(n) || now - (n.leftAt ?? 0) < LEAVE_MS);
      let next: TaskState = { ...s, now, notes };
      const focused = now < s.focusUntil;
      if (!focused && now >= s.nextSpawnAt) {
        const live = notes.filter(active).length;
        if (live < MAX_NOTES) {
          // unseen first, across rounds too: every round adds to the collection
          const idx = pickSpecial(s.seen, a.r1);
          const fresh = !s.seen.includes(idx);
          const unlocked = [...s.unlocked, ...completedBy(s.seen, idx).map((id) => ({ id, at: now }))];
          // somewhere over the grid (0 … 55 % from the top), never over the tag dock
          notes = [...notes, { id: s.nextId, idx, top: Math.round(a.r3 * 55), fresh }];
          next = { ...next, notes, nextId: s.nextId + 1, seen: fresh ? [...s.seen, idx] : s.seen, unlocked };
        }
        next = { ...next, nextSpawnAt: now + taskSpawnGap((s.next - 1) / TARGET) };
      }
      return next;
    }

    case "cell": {
      if (s.phase !== "playing") return s;
      const value = s.grid[a.cell];
      if (value < s.next) return s; // already done
      if (value !== s.next) return { ...s, wrong: { cell: a.cell, at: a.now } };
      const n = s.next + 1;
      if (n > TARGET) {
        const timeMs = a.now - s.startedAt;
        return { ...s, next: n, phase: "won", timeMs, best: s.best ? Math.min(s.best, timeMs) : timeMs, notes: [] };
      }
      return { ...s, next: n, wrong: null };
    }

    case "dismiss": {
      const note = s.notes.find((n) => n.id === a.id);
      if (!note || !active(note)) return s;
      return {
        ...s,
        dismissed: s.dismissed + 1,
        notes: s.notes.map((n) => (n.id === a.id ? { ...n, leftAt: a.now } : n)),
      };
    }

    case "resume": {
      // move every timestamp forward: the pause never happened
      const by = a.pausedMs;
      return {
        ...s,
        now: s.now + by,
        startedAt: s.startedAt + by,
        nextSpawnAt: s.nextSpawnAt + by,
        focusUntil: s.focusUntil + by,
        readyAt: s.readyAt + by,
        notes: s.notes.map((n) => (n.leftAt === undefined ? n : { ...n, leftAt: n.leftAt + by })),
        unlocked: s.unlocked.map((u) => ({ ...u, at: u.at + by })),
        wrong: s.wrong && { ...s.wrong, at: s.wrong.at + by },
      };
    }

    case "tag": {
      if (s.phase !== "playing" || a.now < s.readyAt) return s;
      const focusUntil = a.now + FOCUS_MS;
      return {
        ...s,
        notes: s.notes.map((n) => (active(n) ? { ...n, leftAt: a.now } : n)),
        focusUntil,
        readyAt: focusUntil + RECHARGE_MS,
        nextSpawnAt: focusUntil + 400,
        focusUses: s.focusUses + 1,
      };
    }
  }
}

function clock(ms: number): string {
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * Prototype: a real task interrupted by distractions. Tap the numbers 1–20 in
 * order; notifications cover the grid and must be swiped away — or the FOKUS
 * tag blocks them for 8 s so you can actually get the task done. Win state:
 * the "study session" is done; best time is kept for the page visit.
 */
export function FokusTaskGame({
  lang,
  onExit,
  endCta,
  discovered,
  paused = false,
}: {
  lang: Lang;
  paused?: boolean;
  onExit: () => void;
  endCta?: React.ReactNode;
  discovered?: Set<number>;
}) {
  const c = TASK_COPY[lang];
  const [s, dispatch] = useReducer(taskReducer, taskInitial);
  const [album, setAlbum] = useState(false);
  const startRound = (found?: Set<number>) => {
    track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "task-start" });
    dispatch({
      type: "start",
      now: performance.now(),
      shuffle: Array.from({ length: TARGET }, () => Math.random()),
      found: [...(found ?? [])],
    });
  };
  const reported = useRef(0);

  // `discovered` is one Set per page visit → this runs once, on mount
  useEffect(() => startRound(discovered), [discovered]);
  const restart = () => {
    setAlbum(false);
    startRound(discovered);
  };

  // paused (tutorial reopened): stop the clock, then shift all timers on resume
  useEffect(() => {
    if (!paused) return;
    const at = performance.now();
    return () => dispatch({ type: "resume", pausedMs: performance.now() - at });
  }, [paused]);

  useEffect(() => {
    if (s.phase !== "playing" || paused) return;
    const id = setInterval(
      () => dispatch({ type: "tick", now: performance.now(), r1: Math.random(), r2: Math.random(), r3: Math.random() }),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [s.phase, paused]);

  useEffect(() => {
    for (const i of s.seen) discovered?.add(i);
  }, [s.seen, discovered]);

  useEffect(() => {
    if (s.phase === "won" && reported.current !== s.startedAt) {
      reported.current = s.startedAt;
      track(EVENTS.partnerPlay, {
        partner: PARTNER_OFFER.id,
        action: "task-win",
        seconds: Math.round(s.timeMs / 1000),
        focus: s.focusUses,
      });
    }
  }, [s.phase, s.startedAt, s.timeMs, s.focusUses]);

  const playing = s.phase === "playing";
  const focused = playing && s.now < s.focusUntil;
  const ready = playing && s.now >= s.readyAt;
  const charge = ready ? 1 : focused ? (s.focusUntil - s.now) / FOCUS_MS : 1 - (s.readyAt - s.now) / RECHARGE_MS;
  const live = s.notes.filter(active);
  const elapsed = playing ? s.now - s.startedAt : s.timeMs;
  const banner = [...s.unlocked].reverse().find((u) => s.now - u.at < UNLOCK_SHOW_MS);
  const found = s.seen.filter((i) => SPECIAL.includes(i)).length;
  const set = (id: CollectionId) => COLLECTIONS.find((x) => x.id === id)!;

  return (
    <div className="grid gap-3">
      {/* HUD: the task first */}
      <div className="grid grid-cols-3 items-end gap-2 text-center">
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{clock(elapsed)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.time}</p>
        </div>
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{Math.min(s.next, TARGET)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.nextLabel}</p>
        </div>
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">
            {Math.min(s.next - 1, TARGET)}/{TARGET}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.done}</p>
        </div>
      </div>

      {/* phone */}
      <div
        className="relative h-[min(404px,calc(100dvh-170px))] min-h-[360px] touch-none select-none overflow-hidden rounded-[26px] border-4"
        style={{
          borderColor: focused ? "#7dffb4" : "#0b0f3a",
          background: focused ? "linear-gradient(180deg,#2b3aa8,#182078)" : "#0b0f3a",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-widest opacity-80">
          {focused ? `🔒 ${c.focusMode} ${Math.ceil((s.focusUntil - s.now) / 1000)} s` : c.task.replace("{n}", String(TARGET))}
        </p>

        {/* the task: numbers in shuffled order */}
        <div className="mx-2.5 mt-2 grid grid-cols-4 gap-1.5">
          {s.grid.map((value, cell) => {
            const done = value < s.next;
            const isWrong = s.wrong?.cell === cell && s.now - s.wrong.at < WRONG_MS;
            return (
              <button
                key={cell}
                type="button"
                disabled={!playing || done}
                onPointerDown={() => dispatch({ type: "cell", cell, now: performance.now() })}
                onClick={() => dispatch({ type: "cell", cell, now: performance.now() })}
                className={`flex h-12 touch-manipulation items-center justify-center rounded-lg font-heading text-lg tabular-nums transition-colors ${
                  done ? "bg-[#10c463]/25 text-[#7dffb4]" : isWrong ? "bg-[#ff5a5a] text-white" : "bg-white/95 text-navy"
                }`}
              >
                {done ? "✓" : value}
              </button>
            );
          })}
        </div>

        {/* distractions on top of the task: they swallow taps until dismissed */}
        {s.notes.map((n) => {
          const d = DISTRACTIONS[n.idx];
          return (
            <button
              key={n.id}
              type="button"
              disabled={!active(n)}
              onPointerDown={() => dispatch({ type: "dismiss", id: n.id, now: performance.now() })}
              onClick={() => dispatch({ type: "dismiss", id: n.id, now: performance.now() })}
              className={`absolute inset-x-2.5 z-10 flex h-[54px] touch-manipulation items-center gap-2 rounded-xl bg-white px-2.5 text-left shadow-[0_6px_18px_rgba(0,0,0,0.45)] ${
                active(n) ? "animate-notif-in" : "animate-zap"
              }`}
              style={{ top: `calc(26px + ${n.top}%)` }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: VIA[d.via] }}
              >
                {d.via[0]}
              </span>
              <span className="min-w-0 text-[11px] leading-[1.2] text-navy">
                <b className="flex items-center gap-1">
                  <span className="truncate">{d.from[lang]}</span>
                  {n.fresh && (
                    <span className="shrink-0 rounded-full bg-[#ffd34d] px-1.5 text-[9px] uppercase leading-[14px] text-navy">{c.isNew}</span>
                  )}
                </b>
                <span className="line-clamp-2">{d.text[lang]}</span>
              </span>
            </button>
          );
        })}

        {/* a collection was just completed */}
        {playing && banner && (
          <div
            key={banner.id}
            className="pointer-events-none absolute inset-x-6 top-[38%] z-30 animate-stamp rounded-2xl bg-[#ffd34d] px-3 py-2 text-center font-heading text-sm leading-tight text-navy shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
          >
            {set(banner.id).emoji} {c.setDone} {set(banner.id).name[lang]}!
          </div>
        )}

        {/* tag dock */}
        <div className="absolute inset-x-2.5 bottom-2 z-20 flex h-[76px] items-center gap-3">
          <button
            type="button"
            aria-label={c.tagAria}
            disabled={!ready}
            onPointerDown={() => dispatch({ type: "tag", now: performance.now() })}
            onClick={() => dispatch({ type: "tag", now: performance.now() })}
            className={`shrink-0 touch-manipulation disabled:cursor-default ${ready ? "motion-safe:animate-pulse" : ""}`}
          >
            <FokusDevice size={68} charge={charge} ready={ready} />
          </button>
          <p className="min-w-0 font-heading text-[13px] leading-tight">
            {focused ? c.focusing : ready ? (live.length ? c.tagHintBusy : c.tagHint) : c.recharging}
          </p>
        </div>

        {/* win */}
        {s.phase === "won" && (
          <div className="absolute inset-0 z-40 grid content-center gap-2 rounded-[22px] bg-[#0b0f3a] p-4 text-center animate-fade-up" style={{ color: CREAM }}>
            <p className="animate-stamp font-heading text-xl leading-tight">{c.won}</p>
            <p className="font-heading text-3xl leading-none tabular-nums">{clock(s.timeMs)}</p>
            <p className="text-xs opacity-80">
              {c.best}: {clock(s.best)} · {c.focusUsed.replace("{n}", String(s.focusUses))}
            </p>
            {/* the point of the whole game, in one box */}
            <div className="grid gap-1 rounded-2xl px-4 py-3" style={{ backgroundColor: CREAM, color: BLUE }}>
              <p className="text-sm">
                {c.wonDismissed.split("{n}")[0]}
                <b className="font-heading">{s.dismissed}</b>
                {c.wonDismissed.split("{n}")[1]}
              </p>
              <p className="font-heading text-base leading-tight">{c.wonPunch}</p>
            </div>
            {s.unlocked.length > 0 && (
              <p className="font-heading text-xs" style={{ color: "#ffd34d" }}>
                {c.unlocked} {s.unlocked.map((u) => `${set(u.id).emoji} ${set(u.id).name[lang]}`).join(" · ")}
              </p>
            )}
            {endCta}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={restart}
                className="border-2 px-4 py-2.5 font-heading text-sm"
                style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
              >
                {c.again}
              </button>
              <button
                type="button"
                onClick={() => setAlbum(true)}
                className="border-2 px-3 py-2.5 font-heading text-sm"
                style={{ borderColor: CREAM }}
              >
                {c.collection.replace("{x}", String(found)).replace("{n}", String(SPECIAL.length))}
              </button>
            </div>
            <button type="button" onClick={onExit} className="justify-self-center text-xs underline underline-offset-4 opacity-80">
              {c.exit}
            </button>
          </div>
        )}

        {/* the collection: found messages per kind, the rest locked */}
        {s.phase === "won" && album && (
          // own scroll container with pan-y: the game layer blocks touch scrolling otherwise
          <div className="absolute inset-0 z-50 touch-pan-y overflow-y-auto overscroll-contain rounded-[22px] bg-[#0b0f3a] p-3" style={{ color: CREAM }}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-lg leading-tight">{c.collectionTitle}</p>
              <button type="button" onClick={() => setAlbum(false)} className="border-2 px-3 py-1.5 font-heading text-xs" style={{ borderColor: CREAM }}>
                {c.back}
              </button>
            </div>
            <p className="mt-1 text-[11px] opacity-80">{c.collectionNote}</p>
            <div className="mt-3 grid gap-3">
              {COLLECTIONS.map((col) => {
                const members = COLLECTION_MEMBERS[col.id];
                const have = members.filter((i) => s.seen.includes(i)).length;
                const complete = have === members.length;
                return (
                  <section key={col.id} className="grid gap-1.5">
                    <p className="flex items-center justify-between font-heading text-sm">
                      <span>
                        {col.emoji} {col.name[lang]}
                      </span>
                      <span className="tabular-nums" style={{ color: complete ? "#ffd34d" : undefined }}>
                        {complete ? "★ " : ""}
                        {have}/{members.length}
                      </span>
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-[#ffd34d]" style={{ width: `${(have / members.length) * 100}%` }} />
                    </div>
                    <ul className="grid gap-1">
                      {members
                        .filter((i) => s.seen.includes(i))
                        .map((i) => (
                          <li key={i} className="rounded-lg bg-white px-2 py-1 text-[11px] leading-[1.25] text-navy">
                            <b>{DISTRACTIONS[i].from[lang]}:</b> {DISTRACTIONS[i].text[lang]}
                          </li>
                        ))}
                    </ul>
                    {/* still locked: one small slot each */}
                    {!complete && (
                      <p className="flex flex-wrap gap-1" aria-label={`${members.length - have} × ${c.locked}`}>
                        {Array.from({ length: members.length - have }, (_, k) => (
                          <span key={k} aria-hidden className="rounded-md border border-dashed border-white/30 px-1.5 text-[11px] opacity-60">
                            🔒
                          </span>
                        ))}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
