// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useReducer, useRef } from "react";
import { track, EVENTS } from "@/lib/analytics";
import { DISTRACTIONS, GROUP_MESSAGES, VIA, pickDistraction } from "@/lib/fokus-notifications";
import { CHALLENGE_COPY, PARTNER_OFFER } from "@/lib/partner";
import { FokusDevice } from "./FokusDevice";

type Lang = "de" | "en";

const BLUE = "#182078";
const CREAM = "#fefaf3";
const GOOD_GREEN = "#10c463";

const SLOTS = 5; // fixed places on the screen; no free slot when spawning = distracted
/** The tag is the big joker: slow to charge, but it clears the screen for
 *  double points, pauses everything for 4 s and even breaks a stun. */
export const CHARGE_FULL = 12; // blocks needed for the first charge …
export const CHARGE_STEP = 4; // … and 4 more after every use (12, 16, 20 …)
/** Full pause after using the tag (clock, speed and bursts freeze):
 *  0.8 s effect · one real breath (3 s in, 3 s out) · 3-2-1 countdown. */
const BREATH_MS = 3_000;
const CALM_MS = 800 + 2 * BREATH_MS + 3_000;
const TAG_MULTIPLIER = 2;
const GOOD_TTL = 2_400; // a group message disappears on its own after this
const GOOD_TTL_TUTORIAL = 3_000;
const GROUP_PENALTY = 5; // tapping your own group has to hurt …
const STUN_MS = 1_500; // … and paralyses you: no taps, no tag, while notifications keep coming
const GOOD_SHARE = 0.18;
const LEAVE_MS = 320; // zap animation length
const TICK_MS = 100;
/** Bursts ("group chat explodes"): several at once, made for the tag.
 *  Every 8 s, 3 notifications, from the third burst on 4. */
const BURST_EVERY_MS = 8_000;
function burstSize(n: number): number {
  return n < 2 ? 3 : 4;
}

/** Spawn gap: eases from 0.95 s towards a plateau of ~0.47 s (≈2 per
 *  second — hard but holdable) within about a minute, then creeps only
 *  ~1 ms faster every 2 s down to a floor of 0.42 s. Nobody is forced to
 *  lose, so good runs can set real highscores. */
export function spawnGap(elapsed: number): number {
  const ease = 470 + 480 * Math.exp(-elapsed / 18_000);
  const creep = Math.max(0, (elapsed - 60_000) / 2_000);
  return Math.max(420, ease - creep);
}

/** Notifications keep a fixed slot so nothing jumps while you aim at it. */
type Note = { id: number; kind: "bad" | "good"; idx: number; born: number; slot: number; leftAt?: number };
type Phase = "tutorial" | "playing" | "lost";
/** Hands-on tutorial with one short line each: 0 block one · 1 leave the group
 *  message · 2 use the tag · 3 the tag's focus pause plays, then the round starts */
type TutStep = 0 | 1 | 2 | 3;

interface State {
  phase: Phase;
  tutStep: TutStep;
  tutSpawned: boolean;
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
  flash: { text: "go" | "oops" | "seen" | "burst" | "tag"; at: number; n?: number } | null;
  ripples: number; // bumps on each tag use → re-keys the ripple
  stunnedUntil: number;
  tagUses: number; // each use makes the next charge longer
  pausedMs: number; // total focus-mode time, excluded from the round clock
  burstsDone: number;
  seen: number[]; // distractions shown this round → prefer new ones
  survivedMs: number; // set when the round ends
}

type Action =
  | { type: "boot"; now: number; tutorial: boolean }
  | { type: "restart"; now: number }
  | { type: "tick"; now: number; r1: number; r2: number; r3: number; r4: number }
  | { type: "tap"; id: number; now: number }
  | { type: "tag"; now: number };

export const initial: State = {
  phase: "playing",
  tutStep: 0,
  tutSpawned: false,
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
  ripples: 0,
  stunnedUntil: 0,
  tagUses: 0,
  pausedMs: 0,
  burstsDone: 0,
  seen: [],
  survivedMs: 0,
};

const active = (n: Note) => n.leftAt === undefined;

/** 47_300 → "0:47" */
function clock(ms: number): string {
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Round time that counts: frozen while focus mode (calm) is running. */
export function elapsed(s: State, now: number): number {
  return (
    now - s.startedAt - s.pausedMs + (now < s.calmUntil ? s.calmUntil - now : 0)
  );
}

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
    ripples: s.ripples,
    phase: "playing",
    startedAt: now,
    now,
    nextSpawnAt: now + 600,
    nextId: s.nextId,
    flash: { text: "go", at: now },
  };
}

/** Blocks needed for the next tag charge: grows with every use. */
export function chargeNeeded(s: Pick<State, "tagUses">): number {
  return CHARGE_FULL + CHARGE_STEP * s.tagUses;
}

/** The tag effect: clear distractions (×multiplier points), break a stun, pause. */
function fireTag(s: State, now: number, multiplier: number): State {
  const hit = s.notes.filter((n) => active(n) && n.kind === "bad").length;
  const notes = s.notes.map((n) => (active(n) && n.kind === "bad" ? { ...n, leftAt: now } : n));
  const calmUntil = now + CALM_MS;
  return {
    ...s,
    notes,
    score: s.score + hit * multiplier,
    blocked: s.blocked + hit,
    stunnedUntil: 0,
    flash: { text: "tag", at: now, n: hit * multiplier },
    charge: 0,
    tagUses: s.tagUses + 1,
    calmUntil,
    pausedMs: s.pausedMs + CALM_MS,
    nextSpawnAt: calmUntil + 300,
    ripples: s.ripples + 1,
  };
}

function finish(s: State, now: number): State {
  return { ...s, phase: "lost", survivedMs: elapsed(s, now), best: Math.max(s.best, s.score) };
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "boot":
      return a.tutorial
        ? { ...initial, phase: "tutorial", now: a.now, nextSpawnAt: a.now + 500 }
        : startRound(initial, a.now);

    case "restart":
      return startRound(s, a.now);

    case "tick": {
      if (s.phase === "lost") return s;
      const now = a.now;
      let score = s.score;
      let flash = s.flash;
      // drop finished zaps; group messages left alone expire with a bonus
      let notes = s.notes
        .filter((n) => active(n) || now - (n.leftAt ?? 0) < LEAVE_MS)
        .map((n) => {
          if (active(n) && n.kind === "good" && now - n.born > (s.phase === "tutorial" ? GOOD_TTL_TUTORIAL : GOOD_TTL)) {
            score += 2;
            flash = { text: "seen", at: now };
            return { ...n, leftAt: now };
          }
          return n;
        });
      let next: State = { ...s, now, notes, score, flash };

      if (s.phase === "tutorial") {
        // step 3: the tag's focus pause (breathe, 3-2-1) plays, then the round starts
        if (s.tutStep === 3) return now >= s.calmUntil ? startRound(next, now) : next;
        if (s.tutSpawned && !notes.some(active)) {
          if (s.tutStep === 2) return { ...next, tutStep: 3 };
          return { ...next, tutStep: (s.tutStep + 1) as TutStep, tutSpawned: false, nextSpawnAt: now + 600 };
        }
        if (!s.tutSpawned && now >= s.nextSpawnAt) {
          let id = s.nextId;
          if (s.tutStep === 0) notes = place(notes, { id: id++, kind: "bad", idx: 0, born: now, slot: 1 });
          if (s.tutStep === 1) notes = place(notes, { id: id++, kind: "good", idx: 0, born: now, slot: 1 });
          if (s.tutStep === 2) {
            for (const [slot, idx] of [[0, 1], [2, 2], [3, 3]]) {
              notes = place(notes, { id: id++, kind: "bad", idx, born: now, slot });
            }
            next = { ...next, charge: chargeNeeded(s) };
          }
          return { ...next, notes, nextId: id, tutSpawned: true };
        }
        return next;
      }
      const t = elapsed(s, now);
      if (t >= (s.burstsDone + 1) * BURST_EVERY_MS && now >= s.calmUntil) {
        const free = freeSlots(notes);
        if (free.length === 0) return finish(next, now);
        let id = s.nextId;
        let seen = s.seen;
        free.slice(0, burstSize(s.burstsDone)).forEach((slot, i) => {
          const idx = pickDistraction(t, seen, (a.r3 + i * 0.37) % 1, (a.r4 + i * 0.61) % 1);
          seen = [...seen, idx];
          notes = place(notes, { id: id++, kind: "bad", idx, born: now, slot });
        });
        return {
          ...next,
          notes,
          seen,
          nextId: id,
          burstsDone: s.burstsDone + 1,
          flash: { text: "burst", at: now },
          nextSpawnAt: now + spawnGap(t) * 1.5,
        };
      }
      if (now >= s.nextSpawnAt && now >= s.calmUntil) {
        const free = freeSlots(notes);
        if (free.length === 0) return finish(next, now);
        const slot = free[Math.floor(a.r2 * free.length)];
        const kind = a.r1 < GOOD_SHARE ? "good" : "bad";
        const idx = kind === "good" ? Math.floor(a.r3 * GROUP_MESSAGES.length) : pickDistraction(t, s.seen, a.r3, a.r4);
        notes = place(notes, { id: s.nextId, kind, idx, born: now, slot });
        const seen = kind === "bad" ? [...s.seen, idx] : s.seen;
        next = { ...next, notes, seen, nextId: s.nextId + 1, nextSpawnAt: now + spawnGap(t) };
      }
      return next;
    }

    case "tap": {
      if ((s.phase !== "playing" && s.phase !== "tutorial") || a.now < s.stunnedUntil) return s;
      const note = s.notes.find((n) => n.id === a.id);
      if (!note || !active(note)) return s;
      const notes = s.notes.map((n) => (n.id === a.id ? { ...n, leftAt: a.now } : n));
      if (note.kind === "good") {
        return {
          ...s,
          notes,
          score: Math.max(0, s.score - GROUP_PENALTY),
          flash: { text: "oops", at: a.now },
          stunnedUntil: a.now + STUN_MS,
        };
      }
      return { ...s, notes, score: s.score + 1, blocked: s.blocked + 1, charge: Math.min(chargeNeeded(s), s.charge + 1) };
    }

    case "tag": {
      // usable while stunned on purpose: the tag is the way out
      if ((s.phase !== "playing" && s.phase !== "tutorial") || s.charge < chargeNeeded(s)) return s;
      return fireTag(s, a.now, TAG_MULTIPLIER);
    }
  }
}

/**
 * Endless arcade round inside the FOKUS ad (play until distracted). The
 * first round opens with a hands-on tutorial (block one, leave the group
 * message, use the tag) with two-word hints — no rules text.
 * Score and best live in component state only.
 */
export function FokusChallenge({
  lang,
  tutorial,
  onExit,
  endCta,
}: {
  lang: Lang;
  tutorial: boolean;
  onExit: () => void;
  /** Shown on the result screen (the ad's link). */
  endCta?: React.ReactNode;
}) {
  const c = CHALLENGE_COPY[lang];
  const [s, dispatch] = useReducer(reducer, initial);
  const reportedStart = useRef(0);
  const reportedEnd = useRef(0);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Stun: shake the phone (the red flash and countdown bar are rendered below).
  useEffect(() => {
    if (!s.stunnedUntil || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    phoneRef.current?.animate(
      [0, -10, 9, -7, 6, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 420, easing: "ease-out" },
    );
  }, [s.stunnedUntil]);

  useEffect(() => {
    dispatch({ type: "boot", now: performance.now(), tutorial });
  }, [tutorial]);

  const running = s.phase === "playing" || s.phase === "tutorial";
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => dispatch({ type: "tick", now: performance.now(), r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random() }),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (s.phase === "playing" && reportedStart.current !== s.startedAt) {
      reportedStart.current = s.startedAt;
      track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "challenge-start" });
    }
    if (s.phase === "lost" && reportedEnd.current !== s.startedAt) {
      reportedEnd.current = s.startedAt;
      track(EVENTS.partnerPlay, {
        partner: PARTNER_OFFER.id,
        action: "challenge-end",
        score: s.score,
        seconds: Math.floor(s.survivedMs / 1000),
      });
    }
  }, [s.phase, s.startedAt, s.score, s.survivedMs]);

  const calm = (s.phase === "playing" || s.phase === "tutorial") && s.now < s.calmUntil;
  const calmLeft = calm ? s.calmUntil - s.now : 0; // counts down from CALM_MS
  const live = s.notes.filter(active).length;
  const inTutorial = s.phase === "tutorial";
  const survived = s.phase === "lost" ? s.survivedMs : inTutorial ? 0 : elapsed(s, s.now);
  const need = chargeNeeded(s);
  const ready = s.charge >= need;
  // the start hint ("Los! … Handy voll? …") stays longer so it can be read
  const flashOn = s.flash !== null && s.now - s.flash.at < (s.flash.text === "go" ? 2_200 : 900);
  const flashText = {
    go: c.go,
    oops: c.oops,
    seen: c.seen,
    burst: c.burst,
    tag: c.tagged.replace("{n}", String(s.flash?.n ?? 0)),
  };
  const flashColor = { go: CREAM, oops: CREAM, seen: "#7dffb4", burst: "#ffd34d", tag: "#7dffb4" };
  const tutHint = inTutorial ? [c.tutTap, c.tutGroup, c.tutTag, null][s.tutStep] : null;
  const stunned = running && s.now < s.stunnedUntil;
  const hint = flashOn && s.flash ? flashText[s.flash.text] : stunned ? c.stunned : calm ? null : tutHint;
  const hintColor = flashOn && s.flash ? flashColor[s.flash.text] : CREAM;

  return (
    <div className="grid gap-3">
      {/* HUD */}
      <div className="grid grid-cols-3 items-end gap-2 text-center">
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{inTutorial ? c.practice : clock(survived)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.survived}</p>
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

      {/* phone: fixed slots; hint line + tag dock at the bottom, where the thumb already is */}
      <div
        ref={phoneRef}
        // While playing, gestures on the phone belong to the game: no page
        // scrolling, and a swipe across notifications blocks each one it
        // touches (people instinctively swipe notifications away).
        className={`relative h-[min(404px,calc(100dvh-170px))] min-h-[360px] overflow-hidden rounded-[26px] border-4 ${running ? "touch-none select-none" : ""}`}
        onPointerMove={(e) => {
          if (!running || (e.pointerType === "mouse" && e.buttons === 0)) return;
          const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-note-id]");
          if (hit) dispatch({ type: "tap", id: Number(hit.dataset.noteId), now: performance.now() });
        }}
        style={{
          borderColor: live >= SLOTS || stunned ? "#ff5a5a" : "#0b0f3a",
          background: calm ? "linear-gradient(180deg,#2b3aa8,#182078)" : "#0b0f3a",
          transition: "background 0.3s, border-color 0.2s",
        }}
      >
        <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-white/25" />
        <div className="mt-3 grid gap-1.5 px-2.5">
          {Array.from({ length: SLOTS }, (_, slot) => {
            const n = s.notes.find((x) => x.slot === slot && active(x)) ?? s.notes.find((x) => x.slot === slot);
            return (
              <div key={slot} className="h-[52px]">
                {n && (
                  <button
                    key={n.id}
                    type="button"
                    disabled={!active(n)}
                    // pointerdown reacts on touch, before the finger lifts; click covers keyboard
                    data-note-id={n.id}
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
                        <span className="min-w-0 text-[11px] leading-[1.2] text-navy">
                          <b className="block">FOMO</b>
                          <span className="line-clamp-2">{GROUP_MESSAGES[n.idx % GROUP_MESSAGES.length][lang]}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ backgroundColor: VIA[DISTRACTIONS[n.idx].via] }}
                        >
                          {DISTRACTIONS[n.idx].via[0]}
                        </span>
                        <span className="min-w-0 text-[11px] leading-[1.2] text-navy">
                          <b className="block truncate">{DISTRACTIONS[n.idx].from[lang]}</b>
                          <span className="line-clamp-2">{DISTRACTIONS[n.idx].text[lang]}</span>
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {stunned && (
          <div key={s.stunnedUntil} aria-hidden className="pointer-events-none absolute inset-0 z-10">
            <div className="animate-stun-flash absolute inset-0 bg-[#ff3b3b]" />
            <div className="absolute inset-0 bg-[#3a0610]/45" />
            <div
              className="animate-stun-bar absolute left-0 top-0 h-1.5 w-full origin-left bg-[#ff5a5a]"
              style={{ animationDuration: `${STUN_MS}ms` }}
            />
          </div>
        )}
        {/* focus pause: breathe, then 3-2-1 */}
        {calm && calmLeft < CALM_MS - 800 && (
          <div aria-live="polite" className="pointer-events-none absolute inset-0 z-20 grid place-content-center justify-items-center gap-3 text-center" style={{ color: CREAM }}>
            {calmLeft > 3_000 ? (
              (() => {
                const inhale = calmLeft > 3_000 + BREATH_MS;
                return (
                  <>
                    {/* the circle grows while breathing in and shrinks while breathing out */}
                    <span
                      key={inhale ? "in" : "out"}
                      className={`h-28 w-28 rounded-full border-4 ${inhale ? "motion-safe:animate-inhale" : "motion-safe:animate-exhale"}`}
                      style={{ borderColor: CREAM, backgroundColor: "rgba(254,250,243,0.12)", animationDuration: `${BREATH_MS}ms` }}
                    />
                    <p className="font-heading text-base lowercase opacity-90">{inhale ? c.breatheIn : c.breatheOut}</p>
                  </>
                );
              })()
            ) : (
              <p key={Math.ceil(calmLeft / 1000)} className="animate-stamp font-heading text-7xl leading-none tabular-nums">
                {Math.ceil(calmLeft / 1000)}
              </p>
            )}
          </div>
        )}

        {/* the device pressed onto the screen when used */}
        {flashOn && s.flash?.text === "tag" && s.now - s.flash.at < 800 && (
          <div key={s.flash.at} aria-hidden className="animate-stamp pointer-events-none absolute left-1/2 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2">
            <FokusDevice size={112} />
          </div>
        )}

        {/* tag dock, where the thumb is: the FOKUS device + one line of feedback */}
        <div className="absolute inset-x-2.5 bottom-2 z-20 flex h-[76px] items-center gap-3">
          <button
            type="button"
            aria-label={c.tagAria}
            disabled={!running || !ready}
            onPointerDown={() => dispatch({ type: "tag", now: performance.now() })}
            onClick={() => dispatch({ type: "tag", now: performance.now() })}
            className={`shrink-0 touch-manipulation disabled:cursor-default ${ready && running ? "motion-safe:animate-pulse" : "opacity-90"}`}
          >
            <FokusDevice size={68} charge={s.charge / need} ready={ready && running} />
          </button>
          <p
            key={`${hint ?? ""}-${s.flash?.at ?? 0}`}
            className={`min-w-0 font-heading text-[13px] leading-tight ${hint ? "animate-stamp" : "opacity-80"}`}
            style={{ color: hint ? hintColor : CREAM }}
          >
            {hint ?? (ready && running ? c.tagReady : `${s.charge}/${need}`)}
          </p>
        </div>

        {s.ripples > 0 &&
          [0, 160, 320].map((delay) => (
            <span
              key={`${s.ripples}-${delay}`}
              className="animate-ripple pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 rounded-full border-4"
              style={{ borderColor: CREAM, animationDelay: `${delay}ms` }}
            />
          ))}

        {/* result overlay */}
        {s.phase === "lost" && (
          // z-40: above the tag dock (z-20)
          <div className="absolute inset-0 z-40 grid content-center gap-3 bg-[#0b0f3a] p-4 text-center animate-fade-up" style={{ color: CREAM }}>
            <p className="animate-stamp font-heading text-2xl">
              {c.lostAfter} {clock(s.survivedMs)}! 📱
            </p>
            <p className="font-heading text-4xl tabular-nums">{s.score}</p>
            <p className="text-xs opacity-80">
              {c.best}: {s.best}
            </p>
            {endCta}
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
    </div>
  );
}
