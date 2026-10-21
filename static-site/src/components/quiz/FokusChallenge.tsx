// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useReducer, useRef } from "react";
import { track, EVENTS } from "@/lib/analytics";
import { CHALLENGE_COPY, GAME_NOTIFICATIONS, GROUP_NOTIFICATIONS, PARTNER_OFFER } from "@/lib/partner";

type Lang = "de" | "en";

const BLUE = "#182078";
const CREAM = "#fefaf3";
const GOOD_GREEN = "#10c463";

const ROUND_MS = 30_000;
const SLOTS = 5; // fixed places on the screen; no free slot when spawning = distracted
const CHARGE_FULL = 8; // blocks needed to charge the tag
const CALM_MS = 2_500; // spawn pause after using the tag
const GOOD_TTL = 2_400; // a group message disappears on its own after this
const GOOD_TTL_TUTORIAL = 3_500;
const GOOD_SHARE = 0.18;
const LEAVE_MS = 320; // zap animation length
const TICK_MS = 100;
const TUT_GO_MS = 1_600; // "your turn" pause before the real round

/** Spawn gap shrinks from 0.95 s to 0.3 s over the round — the last
 *  seconds are meant to be hectic (a slow tapper should not survive). */
function spawnGap(elapsed: number): number {
  return Math.max(300, 950 - elapsed * 0.025);
}

/** Notifications keep a fixed slot so nothing jumps while you aim at it. */
type Note = { id: number; kind: "bad" | "good"; idx: number; born: number; slot: number; leftAt?: number };
type Phase = "tutorial" | "playing" | "won" | "lost";
/** Tutorial: 0 tap one away · 1 leave the group message · 2 use the tag · 3 "your turn" */
type TutStep = 0 | 1 | 2 | 3;

interface State {
  phase: Phase;
  tutStep: TutStep;
  tutSpawned: boolean;
  stepAt: number;
  notes: Note[];
  score: number;
  blocked: number;
  best: number;
  startedAt: number;
  now: number;
  nextSpawnAt: number;
  charge: number;
  calmUntil: number;
  nextId: number;
  flash: { text: "oops" | "seen"; at: number } | null;
  waves: number; // bumps on each tag use → re-keys the ripple
}

type Action =
  | { type: "boot"; now: number; tutorial: boolean }
  | { type: "restart"; now: number }
  | { type: "tick"; now: number; r1: number; r2: number }
  | { type: "tap"; id: number; now: number }
  | { type: "tag"; now: number };

const initial: State = {
  phase: "tutorial",
  tutStep: 0,
  tutSpawned: false,
  stepAt: 0,
  notes: [],
  score: 0,
  blocked: 0,
  best: 0,
  startedAt: 0,
  now: 0,
  nextSpawnAt: 0,
  charge: 0,
  calmUntil: 0,
  nextId: 1,
  flash: null,
  waves: 0,
};

const active = (n: Note) => n.leftAt === undefined;

function freeSlots(notes: Note[]): number[] {
  return Array.from({ length: SLOTS }, (_, i) => i).filter((i) => !notes.some((n) => n.slot === i && active(n)));
}

/** Put a note into a slot, replacing a note that is still zapping out there. */
function place(notes: Note[], note: Note): Note[] {
  return [...notes.filter((n) => n.slot !== note.slot), note];
}

function startRound(s: State, now: number): State {
  return {
    ...initial,
    best: s.best,
    waves: s.waves,
    phase: "playing",
    startedAt: now,
    now,
    nextSpawnAt: now + 400,
    nextId: s.nextId,
  };
}

function finish(s: State, phase: "won" | "lost"): State {
  return { ...s, phase, best: Math.max(s.best, s.score) };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "boot":
      return a.tutorial
        ? { ...initial, now: a.now, stepAt: a.now, nextSpawnAt: a.now + 500 }
        : startRound(initial, a.now);

    case "restart":
      return startRound(s, a.now);

    case "tick": {
      if (s.phase === "won" || s.phase === "lost") return s;
      const now = a.now;
      const ttl = s.phase === "tutorial" ? GOOD_TTL_TUTORIAL : GOOD_TTL;
      let score = s.score;
      let flash = s.flash;
      // drop finished zaps; group messages left alone expire with a bonus
      let notes = s.notes
        .filter((n) => active(n) || now - (n.leftAt ?? 0) < LEAVE_MS)
        .map((n) => {
          if (active(n) && n.kind === "good" && now - n.born > ttl) {
            score += 2;
            flash = { text: "seen", at: now };
            return { ...n, leftAt: now };
          }
          return n;
        });
      let next: State = { ...s, now, notes, score, flash };
      const nobodyLeft = !notes.some(active);

      if (s.phase === "tutorial") {
        if (s.tutStep === 3) return now - s.stepAt > TUT_GO_MS ? startRound(next, now) : next;
        if (s.tutSpawned && nobodyLeft) {
          const step = (s.tutStep + 1) as TutStep;
          return { ...next, tutStep: step, tutSpawned: false, stepAt: now, nextSpawnAt: now + 600 };
        }
        if (!s.tutSpawned && now >= s.nextSpawnAt) {
          let id = s.nextId;
          if (s.tutStep === 0) notes = place(notes, { id: id++, kind: "bad", idx: 0, born: now, slot: 1 });
          if (s.tutStep === 1) notes = place(notes, { id: id++, kind: "good", idx: 0, born: now, slot: 1 });
          if (s.tutStep === 2) {
            for (const [slot, idx] of [[0, 1], [2, 2], [3, 3]]) {
              notes = place(notes, { id: id++, kind: "bad", idx, born: now, slot });
            }
            next = { ...next, charge: CHARGE_FULL };
          }
          return { ...next, notes, nextId: id, tutSpawned: true };
        }
        return next;
      }

      if (now - s.startedAt >= ROUND_MS) return finish(next, "won");
      if (now >= s.nextSpawnAt && now >= s.calmUntil) {
        const free = freeSlots(notes);
        if (free.length === 0) return finish(next, "lost");
        const slot = free[Math.floor(a.r2 * free.length)];
        const kind = a.r1 < GOOD_SHARE ? "good" : "bad";
        notes = place(notes, { id: s.nextId, kind, idx: Math.floor(a.r2 * 1000) + s.nextId, born: now, slot });
        next = { ...next, notes, nextId: s.nextId + 1, nextSpawnAt: now + spawnGap(now - s.startedAt) };
      }
      return next;
    }

    case "tap": {
      if (s.phase !== "playing" && s.phase !== "tutorial") return s;
      const note = s.notes.find((n) => n.id === a.id);
      if (!note || !active(note)) return s;
      const notes = s.notes.map((n) => (n.id === a.id ? { ...n, leftAt: a.now } : n));
      if (note.kind === "good") {
        return { ...s, notes, score: Math.max(0, s.score - 2), flash: { text: "oops", at: a.now } };
      }
      return { ...s, notes, score: s.score + 1, blocked: s.blocked + 1, charge: Math.min(CHARGE_FULL, s.charge + 1) };
    }

    case "tag": {
      if ((s.phase !== "playing" && s.phase !== "tutorial") || s.charge < CHARGE_FULL) return s;
      const hit = s.notes.filter((n) => active(n) && n.kind === "bad").length;
      const notes = s.notes.map((n) => (active(n) && n.kind === "bad" ? { ...n, leftAt: a.now } : n));
      const calmUntil = a.now + CALM_MS;
      return {
        ...s,
        notes,
        score: s.score + hit,
        blocked: s.blocked + hit,
        charge: 0,
        calmUntil,
        nextSpawnAt: calmUntil + 300,
        waves: s.waves + 1,
      };
    }
  }
}

/**
 * 30-second arcade round inside the FOKUS ad. Starts with a short hands-on
 * tutorial instead of a rules screen: tap distractions away, leave your
 * group's messages alone, use the charged tag to clear the screen. Score and
 * best live in component state only.
 */
export function FokusChallenge({ lang, tutorial, onExit }: { lang: Lang; tutorial: boolean; onExit: () => void }) {
  const c = CHALLENGE_COPY[lang];
  const bad = GAME_NOTIFICATIONS[lang];
  const good = GROUP_NOTIFICATIONS[lang];
  const [s, dispatch] = useReducer(reducer, initial);
  const reportedStart = useRef(0);
  const reportedEnd = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // The game is taller than the demo: bring it fully on screen when it starts.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    dispatch({ type: "boot", now: performance.now(), tutorial });
  }, [tutorial]);

  const running = s.phase === "playing" || s.phase === "tutorial";
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => dispatch({ type: "tick", now: performance.now(), r1: Math.random(), r2: Math.random() }),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (s.phase === "playing" && reportedStart.current !== s.startedAt) {
      reportedStart.current = s.startedAt;
      track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "challenge-start" });
    }
    if ((s.phase === "won" || s.phase === "lost") && reportedEnd.current !== s.startedAt) {
      reportedEnd.current = s.startedAt;
      track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "challenge-end", result: s.phase, score: s.score });
    }
  }, [s.phase, s.startedAt, s.score]);

  const inTutorial = s.phase === "tutorial";
  const calm = s.phase === "playing" && s.now < s.calmUntil;
  const live = s.notes.filter(active).length;
  const secondsLeft = s.phase === "playing" || s.phase === "won" || s.phase === "lost"
    ? Math.max(0, Math.ceil((ROUND_MS - (s.now - s.startedAt)) / 1000))
    : 30;
  const ready = s.charge >= CHARGE_FULL;
  const flashOn = s.flash !== null && s.now - s.flash.at < 900;
  const tutHint = inTutorial ? [c.tutTap, c.tutGroup, c.tutTag, c.tutGo][s.tutStep] : null;
  const hint = flashOn ? (s.flash?.text === "oops" ? c.oops : c.seen) : calm ? `🔒 ${c.calm}` : tutHint;
  const hintColor = flashOn ? (s.flash?.text === "oops" ? "#ff8a8a" : "#7dffb4") : CREAM;

  return (
    <div ref={rootRef} className="grid scroll-my-4 gap-3">
      {/* HUD */}
      <div className="grid grid-cols-3 items-end gap-2 text-center">
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{inTutorial ? c.practice : `${secondsLeft}s`}</p>
          <div className="mt-1 h-1.5 bg-white/15">
            <div
              className="h-full transition-[width] duration-100 ease-linear"
              style={{ width: `${inTutorial ? 100 : (secondsLeft / 30) * 100}%`, backgroundColor: CREAM }}
            />
          </div>
        </div>
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{s.score}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.points}</p>
        </div>
        <div>
          <div className="flex justify-center gap-1" aria-label={`${live}/${SLOTS}`}>
            {Array.from({ length: SLOTS }, (_, i) => (
              <span
                key={i}
                className="h-4 w-2.5 border-2"
                style={{
                  borderColor: CREAM,
                  backgroundColor: i < live ? (live >= SLOTS - 1 ? "#ff5a5a" : CREAM) : "transparent",
                }}
              />
            ))}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">📱 {live}/{SLOTS}</p>
        </div>
      </div>

      {/* phone: fixed slots, hint bar at the bottom */}
      <div
        className="relative h-[352px] overflow-hidden rounded-[26px] border-4"
        style={{
          borderColor: live >= SLOTS ? "#ff5a5a" : "#0b0f3a",
          background: calm ? "linear-gradient(180deg,#2b3aa8,#182078)" : "#0b0f3a",
          transition: "background 0.3s, border-color 0.2s",
        }}
      >
        <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-white/25" />
        <div className="mt-3 grid gap-1.5 px-2.5">
          {Array.from({ length: SLOTS }, (_, slot) => {
            const n = s.notes.find((x) => x.slot === slot && active(x)) ?? s.notes.find((x) => x.slot === slot);
            return (
              <div key={slot} className="h-12">
                {n && (
                  <button
                    key={n.id}
                    type="button"
                    disabled={!active(n)}
                    // pointerdown reacts on touch, before the finger lifts; click covers keyboard
                    onPointerDown={() => dispatch({ type: "tap", id: n.id, now: performance.now() })}
                    onClick={() => dispatch({ type: "tap", id: n.id, now: performance.now() })}
                    className={`flex h-full w-full touch-manipulation items-center gap-2 rounded-xl px-2.5 text-left ${
                      n.kind === "good" ? "border-[3px] bg-white" : "bg-white/95"
                    } ${active(n) ? "animate-notif-in" : "animate-zap"}`}
                    style={n.kind === "good" ? { borderColor: GOOD_GREEN } : undefined}
                  >
                    {n.kind === "good" ? (
                      <>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ backgroundColor: GOOD_GREEN }}
                        >
                          ★
                        </span>
                        <span className="min-w-0 text-xs leading-tight text-navy">
                          <b className="block">FOMO</b>
                          <span className="line-clamp-1">{good[n.idx % good.length]}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ backgroundColor: bad[n.idx % bad.length].color }}
                        >
                          {bad[n.idx % bad.length].app[0]}
                        </span>
                        <span className="min-w-0 text-xs leading-tight text-navy">
                          <b className="block">{bad[n.idx % bad.length].app}</b>
                          <span className="line-clamp-1">{bad[n.idx % bad.length].text}</span>
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {hint && (
          <p
            key={`${hint}-${s.flash?.at ?? 0}`}
            className="animate-stamp pointer-events-none absolute inset-x-2 bottom-3 text-center font-heading text-sm leading-tight"
            style={{ color: hintColor }}
          >
            {hint}
          </p>
        )}
        {s.waves > 0 &&
          [0, 160, 320].map((delay) => (
            <span
              key={`${s.waves}-${delay}`}
              className="animate-ripple pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 rounded-full border-4"
              style={{ borderColor: CREAM, animationDelay: `${delay}ms` }}
            />
          ))}

        {/* result overlay */}
        {(s.phase === "won" || s.phase === "lost") && (
          <div className="absolute inset-0 grid content-center gap-3 bg-[#0b0f3a]/95 p-4 text-center animate-fade-up" style={{ color: CREAM }}>
            <p className="animate-stamp font-heading text-2xl">{s.phase === "won" ? c.won : c.lost}</p>
            <p className="font-heading text-4xl tabular-nums">{s.score}</p>
            <p className="text-xs">
              {c.points} · {s.blocked} {c.blocked} · {c.best}: {s.best}
            </p>
            <p className="text-xs opacity-80">{c.endLine}</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "restart", now: performance.now() })}
              className="justify-self-center border-2 px-5 py-2.5 font-heading text-sm"
              style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
            >
              {c.again}
            </button>
            <button type="button" onClick={onExit} className="justify-self-center text-xs underline underline-offset-4 opacity-80">
              {c.exit}
            </button>
          </div>
        )}
      </div>

      {/* tag */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={c.tagAria}
            disabled={!running || !ready}
            onClick={() => dispatch({ type: "tag", now: performance.now() })}
            className="relative grid h-16 w-16 touch-manipulation place-items-center rounded-full p-1 disabled:cursor-default"
            style={{ background: `conic-gradient(${CREAM} ${(s.charge / CHARGE_FULL) * 360}deg, rgba(255,255,255,0.15) 0)` }}
          >
            {ready && running && (
              <span aria-hidden className="motion-safe:animate-pulse-ring absolute inset-0 rounded-full border-4" style={{ borderColor: CREAM }} />
            )}
            <span
              className="flex h-full w-full items-center justify-center rounded-full font-heading text-[10px] uppercase tracking-widest"
              style={{ backgroundColor: ready ? CREAM : BLUE, color: ready ? BLUE : CREAM, boxShadow: `inset 0 0 0 3px ${CREAM}` }}
            >
              Tag
            </span>
          </button>
          <p className="w-24 text-left text-xs font-bold uppercase tracking-wider">
            {ready ? c.tagReady : `${c.tagCharging} ${s.charge}/${CHARGE_FULL}`}
          </p>
        </div>
        {running && (
          <button type="button" onClick={onExit} className="text-xs underline underline-offset-4 opacity-70">
            {c.exit}
          </button>
        )}
      </div>
    </div>
  );
}
