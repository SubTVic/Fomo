// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useRef, useState } from "react";
import { track, EVENTS } from "@/lib/analytics";
import { PARTNER_COPY, PARTNER_OFFER } from "@/lib/partner";
import { FokusDevice } from "./FokusDevice";

type Lang = "de" | "en";
type Stage = "idle" | "flying" | "blocked";

const SPAWN_MS = 1100;
const CREAM = "#fefaf3";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Mini game inside the FOKUS ad: a phone keeps buzzing with notifications
 * until the user drags (or taps) the FOKUS tag onto it. Then radio waves,
 * the notifications are zapped, the screen goes calm and a counter runs up.
 * Pure UI — nothing is stored, only one anonymous Umami event per play.
 */
export function FokusTagGame({ lang, onChallenge }: { lang: Lang; onChallenge?: () => void }) {
  const t = PARTNER_COPY[lang];

  const rootRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [inView, setInView] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; baseX: number; baseY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  // Until the tag is touched once, a ghost hand demonstrates the drag —
  // a user test showed people assumed tapping the ad would open the shop.
  const [touched, setTouched] = useState(false);
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (touched || stage !== "idle" || !inView) return;
    const measure = () => {
      const phone = phoneRef.current?.getBoundingClientRect();
      const tag = tagRef.current?.getBoundingClientRect();
      if (!phone || !tag) return;
      setHint({
        x: phone.left + phone.width / 2 - (tag.left + tag.width / 2),
        y: phone.top + phone.height * 0.8 - (tag.top + tag.height / 2),
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [touched, stage, inView]);

  // Only buzz while the ad is on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (stage !== "idle" || !inView) return;
    const spawn = () => {
      if (!prefersReducedMotion()) {
        phoneRef.current?.animate(
          [
            { transform: "rotate(0)" },
            { transform: "rotate(-4deg)" },
            { transform: "rotate(4deg)" },
            { transform: "rotate(-2deg)" },
            { transform: "rotate(0)" },
          ],
          { duration: 320 },
        );
      }
    };
    const first = setTimeout(spawn, 250);
    const id = setInterval(spawn, SPAWN_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [stage, inView]);

  // Straight into the mini game once the zap has played (no rules screen).
  useEffect(() => {
    if (stage !== "blocked" || !onChallenge) return;
    const id = setTimeout(onChallenge, prefersReducedMotion() ? 600 : 1400);
    return () => clearTimeout(id);
  }, [stage, onChallenge]);

  function activate(method: "drag" | "tap") {
    if (stage !== "idle") return;
    const phone = phoneRef.current?.getBoundingClientRect();
    const tag = tagRef.current?.getBoundingClientRect();
    if (phone && tag) {
      // tag rect already includes the current offset → move by the remaining delta
      setOffset((o) => ({
        x: o.x + (phone.left + phone.width / 2) - (tag.left + tag.width / 2),
        y: o.y + (phone.top + phone.height * 0.8) - (tag.top + tag.height / 2),
      }));
    }
    setStage("flying");
    track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "block", method });
    setTimeout(() => setStage("blocked"), prefersReducedMotion() ? 0 : 380);
  }

  function replay() {
    track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "replay" });
    setOffset({ x: 0, y: 0 });
    setStage("idle");
  }

  function overPhone(x: number, y: number) {
    const r = phoneRef.current?.getBoundingClientRect();
    if (!r) return false;
    const pad = 24; // forgiving drop zone for thumbs
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (stage !== "idle") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTouched(true);
    drag.current = { x: e.clientX, y: e.clientY, baseX: offset.x, baseY: offset.y, moved: false };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    setOffset({ x: d.baseX + dx, y: d.baseY + dy });
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d?.moved) return; // plain tap → handled by onClick
    suppressClick.current = true;
    if (overPhone(e.clientX, e.clientY)) activate("drag");
    else setOffset({ x: 0, y: 0 }); // snap back
  }

  function onClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setTouched(true);
    activate("tap");
  }

  const blocked = stage === "blocked";

  return (
    <div ref={rootRef} className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[136px_minmax(0,1fr)]">
      {/* phone */}
      <div
        ref={phoneRef}
        className="relative h-[168px] overflow-hidden rounded-[20px] border-4 sm:h-[184px]"
        style={{ borderColor: "#0b0f3a", background: blocked ? "linear-gradient(180deg,#2b3aa8,#182078)" : "#3a0610", transition: "background 0.4s" }}
        aria-hidden
      >
        <div className="mx-auto mt-1.5 h-1.5 w-10 rounded-full bg-white/25" />
        <p className="mt-1 text-center font-heading text-[11px] text-white/70">09:41</p>
        {/* a warning sign instead of a pile of notifications: easier to read at a glance */}
        {!blocked && (
          <div className="absolute inset-x-0 top-6 grid justify-items-center gap-1 px-1.5 text-center">
            <span className="motion-safe:animate-pulse text-4xl leading-none">⚠️</span>
            <span className="font-heading text-[11px] uppercase leading-tight" style={{ color: "#ffd34d" }}>
              {t.danger}
            </span>
          </div>
        )}
        {stage === "idle" && (!touched || dragging) && (
          // drop target at the bottom of the screen, clear of the warning sign
          <div className="pointer-events-none absolute left-1/2 top-[80%] z-10 -translate-x-1/2 -translate-y-1/2">
            <span
              className="motion-safe:animate-pulse flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-dashed font-heading text-[8px] uppercase leading-none"
              style={{ borderColor: CREAM, backgroundColor: "rgba(24,32,120,0.9)", color: CREAM }}
            >
              {t.gameDrop}
            </span>
          </div>
        )}
        {blocked && (
          <div className="absolute inset-x-0 top-6 grid justify-items-center gap-1 px-1.5 text-center">
            <span className="animate-stamp text-3xl leading-none">🔒</span>
            <span className="animate-stamp font-heading text-[11px] leading-tight" style={{ color: CREAM, animationDelay: "120ms" }}>
              {t.blocked}
            </span>
          </div>
        )}
        {blocked &&
          [0, 160, 320].map((delay) => (
            <span
              key={delay}
              className="animate-ripple pointer-events-none absolute left-1/2 top-[80%] h-16 w-16 rounded-full border-4"
              style={{ borderColor: CREAM, animationDelay: `${delay}ms` }}
            />
          ))}
      </div>

      {/* controls */}
      <div className="grid justify-items-center gap-3 text-center">
        {blocked ? (
          <>
            <p className="font-heading text-base leading-tight">✓ {t.blocked}</p>
            {!onChallenge && (
              <button
                type="button"
                onClick={replay}
                className="text-xs font-bold uppercase tracking-wider underline underline-offset-4 opacity-80 transition-opacity hover:opacity-100"
              >
                ↺ {t.again}
              </button>
            )}
          </>
        ) : (
          <div className="grid gap-1">
            <p className="font-heading text-sm leading-snug">{t.gameHint}</p>
            <p className="text-xs leading-snug opacity-80">{t.gameSafe}</p>
          </div>
        )}
        <div className="relative h-16 w-16">
          {stage === "idle" && !dragging && (
            <span aria-hidden className="motion-safe:animate-pulse-ring absolute inset-0 rounded-full border-4 opacity-60" style={{ borderColor: CREAM }} />
          )}
          {stage === "idle" && !touched && hint && (
            <span
              aria-hidden
              className="animate-drag-hint pointer-events-none absolute inset-0 z-30"
              style={{ "--hx": `${hint.x}px`, "--hy": `${hint.y}px` } as React.CSSProperties}
            >
              <span className="absolute inset-0 opacity-50">
                <FokusDevice size={64} />
              </span>
              <span className="absolute -bottom-3 -right-2 text-3xl leading-none drop-shadow">👆</span>
            </span>
          )}
          <button
            ref={tagRef}
            type="button"
            aria-label={t.gameTagAria}
            disabled={stage !== "idle"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={onClick}
            className="relative z-20 h-16 w-16 cursor-grab touch-none select-none drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)] active:cursor-grabbing disabled:cursor-default"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${stage === "idle" ? (dragging ? 1.12 : 1) : 0.7})`,
              transition: dragging ? "none" : "transform 0.38s cubic-bezier(0.3, 1.3, 0.5, 1)",
              opacity: blocked ? 0.85 : 1,
            }}
          >
            <FokusDevice size={64} />
          </button>
        </div>
      </div>
    </div>
  );
}
