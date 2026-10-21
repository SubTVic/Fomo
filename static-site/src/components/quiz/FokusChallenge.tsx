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
const MAX_NOTES = 5; // spawning a 6th one = distracted
const CHARGE_FULL = 8; // blocks needed to charge the tag
const CALM_MS = 2_500; // spawn pause after using the tag
const GOOD_TTL = 2_400; // a group message disappears on its own after this
const GOOD_SHARE = 0.18;
const LEAVE_MS = 320; // zap animation length
const TICK_MS = 100;

/** Spawn gap shrinks from 0.95 s to 0.3 s over the round — the last
 *  seconds are meant to be hectic (a slow tapper should not survive). */
function spawnGap(elapsed: number): number {
  return Math.max(300, 950 - elapsed * 0.025);
}

type Note = { id: number; kind: "bad" | "good"; idx: number; born: number; leftAt?: number };
type Phase = "intro" | "playing" | "won" | "lost";

interface State {
  phase: Phase;
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
  flash: { text: "oops" | "seen" | "calm"; at: number } | null;
  waves: number; // bumps on each tag use → re-keys the ripple
}

type Action =
  | { type: "start"; now: number }
  | { type: "tick"; now: number; r1: number; r2: number }
  | { type: "tap"; id: number; now: number }
  | { type: "tag"; now: number };

const initial: State = {
  phase: "intro",
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

function finish(s: State, phase: "won" | "lost"): State {
  return { ...s, phase, best: Math.max(s.best, s.score) };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start":
      return { ...initial, best: s.best, phase: "playing", startedAt: a.now, now: a.now, nextSpawnAt: a.now + 400 };

    case "tick": {
      if (s.phase !== "playing") return s;
      const now = a.now;
      let score = s.score;
      let flash = s.flash;
      // drop finished zaps; group messages left alone expire with a bonus
      let notes = s.notes
        .filter((n) => n.leftAt === undefined || now - n.leftAt < LEAVE_MS)
        .map((n) => {
          if (active(n) && n.kind === "good" && now - n.born > GOOD_TTL) {
            score += 2;
            flash = { text: "seen", at: now };
            return { ...n, leftAt: now };
          }
          return n;
        });
      let next: State = { ...s, now, notes, score, flash };
      if (now - s.startedAt >= ROUND_MS) return finish(next, "won");
      if (now >= s.nextSpawnAt && now >= s.calmUntil) {
        if (notes.filter(active).length >= MAX_NOTES) return finish(next, "lost");
        const kind = a.r1 < GOOD_SHARE ? "good" : "bad";
        notes = [{ id: s.nextId, kind, idx: Math.floor(a.r2 * 1000), born: now }, ...notes];
        next = { ...next, notes, nextId: s.nextId + 1, nextSpawnAt: now + spawnGap(now - s.startedAt) };
      }
      return next;
    }

    case "tap": {
      if (s.phase !== "playing") return s;
      const note = s.notes.find((n) => n.id === a.id);
      if (!note || !active(note)) return s;
      const notes = s.notes.map((n) => (n.id === a.id ? { ...n, leftAt: a.now } : n));
      if (note.kind === "good") {
        return { ...s, notes, score: Math.max(0, s.score - 2), flash: { text: "oops", at: a.now } };
      }
      return { ...s, notes, score: s.score + 1, blocked: s.blocked + 1, charge: Math.min(CHARGE_FULL, s.charge + 1) };
    }

    case "tag": {
      if (s.phase !== "playing" || s.charge < CHARGE_FULL) return s;
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
        flash: { text: "calm", at: a.now },
        waves: s.waves + 1,
      };
    }
  }
}

/**
 * 30-second arcade round inside the FOKUS ad: tap distractions away before
 * the phone overflows, leave your group's messages alone, use the charged tag
 * to clear the screen. Score and best live in component state only.
 */
export function FokusChallenge({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const c = CHALLENGE_COPY[lang];
  const bad = GAME_NOTIFICATIONS[lang];
  const good = GROUP_NOTIFICATIONS[lang];
  const [s, dispatch] = useReducer(reducer, initial);
  const reported = useRef(0); // startedAt of the last round already tracked

  useEffect(() => {
    if (s.phase !== "playing") return;
    const id = setInterval(
      () => dispatch({ type: "tick", now: performance.now(), r1: Math.random(), r2: Math.random() }),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [s.phase]);

  useEffect(() => {
    if ((s.phase === "won" || s.phase === "lost") && reported.current !== s.startedAt) {
      reported.current = s.startedAt;
      track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "challenge-end", result: s.phase, score: s.score });
    }
  }, [s.phase, s.startedAt, s.score]);

  function start() {
    track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "challenge-start" });
    dispatch({ type: "start", now: performance.now() });
  }

  const playing = s.phase === "playing";
  const calm = playing && s.now < s.calmUntil;
  const live = s.notes.filter(active).length;
  const secondsLeft = s.phase === "intro" ? 30 : Math.max(0, Math.ceil((ROUND_MS - (s.now - s.startedAt)) / 1000));
  const ready = s.charge >= CHARGE_FULL;
  const flashOn = s.flash && s.now - s.flash.at < 900;

  return (
    <div className="grid gap-3">
      {/* HUD */}
      <div className="grid grid-cols-3 items-end gap-2 text-center">
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{secondsLeft}s</p>
          <div className="mt-1 h-1.5 bg-white/15">
            <div
              className="h-full transition-[width] duration-100 ease-linear"
              style={{ width: `${(secondsLeft / 30) * 100}%`, backgroundColor: CREAM }}
            />
          </div>
        </div>
        <div>
          <p className="font-heading text-2xl leading-none tabular-nums">{s.score}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.points}</p>
        </div>
        <div>
          <div className="flex justify-center gap-1" aria-label={`${live}/${MAX_NOTES}`}>
            {Array.from({ length: MAX_NOTES }, (_, i) => (
              <span
                key={i}
                className="h-4 w-2.5 border-2"
                style={{
                  borderColor: CREAM,
                  backgroundColor: i < live ? (live >= MAX_NOTES - 1 ? "#ff5a5a" : CREAM) : "transparent",
                }}
              />
            ))}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">📱 {live}/{MAX_NOTES}</p>
        </div>
      </div>

      {/* phone */}
      <div
        className="relative h-[320px] overflow-hidden rounded-[26px] border-4"
        style={{
          borderColor: live >= MAX_NOTES ? "#ff5a5a" : "#0b0f3a",
          background: calm ? "linear-gradient(180deg,#2b3aa8,#182078)" : "#0b0f3a",
          transition: "background 0.3s, border-color 0.2s",
        }}
      >
        <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-white/25" />
        <div className="mt-3 grid gap-2 px-2.5">
          {s.notes.map((n) => {
            const leaving = n.leftAt !== undefined;
            if (n.kind === "good") {
              return (
                <button
                  key={n.id}
                  type="button"
                  disabled={leaving}
                  onClick={() => dispatch({ type: "tap", id: n.id, now: performance.now() })}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border-[3px] bg-white px-2.5 py-1.5 text-left ${
                    leaving ? "animate-zap" : "animate-notif-in"
                  }`}
                  style={{ borderColor: GOOD_GREEN }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ backgroundColor: GOOD_GREEN }}>
                    ★
                  </span>
                  <span className="min-w-0 text-xs leading-tight text-navy">
                    <b className="block">FOMO</b>
                    <span className="line-clamp-1">{good[n.idx % good.length]}</span>
                  </span>
                </button>
              );
            }
            const note = bad[n.idx % bad.length];
            return (
              <button
                key={n.id}
                type="button"
                disabled={leaving}
                onClick={() => dispatch({ type: "tap", id: n.id, now: performance.now() })}
                className={`flex min-h-11 items-center gap-2 rounded-xl bg-white/95 px-2.5 py-1.5 text-left active:scale-95 ${
                  leaving ? "animate-zap" : "animate-notif-in"
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: note.color }}
                >
                  {note.app[0]}
                </span>
                <span className="min-w-0 text-xs leading-tight text-navy">
                  <b className="block">{note.app}</b>
                  <span className="line-clamp-1">{note.text}</span>
                </span>
              </button>
            );
          })}
        </div>

        {calm && (
          <p className="animate-stamp pointer-events-none absolute inset-x-0 bottom-6 text-center font-heading text-lg" style={{ color: CREAM }}>
            🔒 {c.calm}
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
        {flashOn && s.flash?.text !== "calm" && (
          <p
            key={s.flash?.at}
            className="animate-stamp pointer-events-none absolute inset-x-0 top-1/2 text-center font-heading text-base"
            style={{ color: s.flash?.text === "oops" ? "#ff8a8a" : "#7dffb4" }}
          >
            {s.flash?.text === "oops" ? c.oops : c.seen}
          </p>
        )}

        {/* intro / result overlay */}
        {!playing && (
          <div className="absolute inset-0 grid content-center gap-3 bg-[#0b0f3a]/95 p-4 text-center animate-fade-up" style={{ color: CREAM }}>
            {s.phase === "intro" ? (
              <>
                <p className="font-heading text-xl">{c.title}</p>
                <ul className="grid gap-1.5 text-left text-xs leading-snug">
                  {c.rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="animate-stamp font-heading text-2xl">{s.phase === "won" ? c.won : c.lost}</p>
                <p className="font-heading text-4xl tabular-nums">{s.score}</p>
                <p className="text-xs">
                  {c.points} · {s.blocked} {c.blocked} · {c.best}: {s.best}
                </p>
                <p className="text-xs opacity-80">{c.endLine}</p>
              </>
            )}
            <button
              type="button"
              onClick={start}
              className="justify-self-center border-2 px-5 py-2.5 font-heading text-sm"
              style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
            >
              {s.phase === "intro" ? c.start : c.again}
            </button>
            <button type="button" onClick={onExit} className="justify-self-center text-xs underline underline-offset-4 opacity-80">
              {c.exit}
            </button>
          </div>
        )}
      </div>

      {/* tag */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={c.tagAria}
          disabled={!playing || !ready}
          onClick={() => dispatch({ type: "tag", now: performance.now() })}
          className="relative grid h-16 w-16 place-items-center rounded-full p-1 disabled:cursor-default"
          style={{ background: `conic-gradient(${CREAM} ${(s.charge / CHARGE_FULL) * 360}deg, rgba(255,255,255,0.15) 0)` }}
        >
          {ready && playing && (
            <span aria-hidden className="motion-safe:animate-pulse-ring absolute inset-0 rounded-full border-4" style={{ borderColor: CREAM }} />
          )}
          <span
            className="flex h-full w-full items-center justify-center rounded-full font-heading text-[10px] uppercase tracking-widest"
            style={{ backgroundColor: ready ? CREAM : BLUE, color: ready ? BLUE : CREAM, boxShadow: `inset 0 0 0 3px ${CREAM}` }}
          >
            Tag
          </span>
        </button>
        <p className="w-28 text-left text-xs font-bold uppercase tracking-wider">
          {ready ? c.tagReady : `${c.tagCharging} ${s.charge}/${CHARGE_FULL}`}
        </p>
      </div>
    </div>
  );
}
