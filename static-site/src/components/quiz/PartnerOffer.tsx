// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { track, EVENTS } from "@/lib/analytics";
import {
  CHALLENGE_COPY,
  PARTNER_COPY,
  PARTNER_OFFER,
  TASK_COPY,
  type PartnerPlacement,
} from "@/lib/partner";
import { DISTRACTIONS } from "@/lib/fokus-notifications";
import { FokusChallenge } from "./FokusChallenge";
import { FokusTaskGame, TARGET } from "./FokusTaskGame";
import { FokusDevice } from "./FokusDevice";

type Lang = "de" | "en";

// FOKUS brand colours (from their logo file): deep blue + cream.
const BLUE = "#182078";
const CREAM = "#fefaf3";

function AdLabel({ lang, className }: { lang: Lang; className: string }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-widest ${className}`}>
      <span className="border-2 border-current px-1.5">{PARTNER_COPY[lang].label}</span>
    </p>
  );
}

function Logo({ variant, className }: { variant: "cream" | "blue"; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, tiny local asset
    <img
      src={`/partners/fokus-logo-${variant}.png`}
      alt={PARTNER_OFFER.name}
      width={480}
      height={60}
      loading="lazy"
      className={`w-auto ${className}`}
    />
  );
}

function PartnerLink({
  placement,
  className,
  style,
  children,
}: {
  placement: PartnerPlacement;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <a
      href={PARTNER_OFFER.url}
      target="_blank"
      // "sponsored": paid link, no referrer/opener handed to the partner.
      rel="sponsored noopener noreferrer"
      onClick={() => track(EVENTS.partnerClick, { partner: PARTNER_OFFER.id, placement })}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

/** Second line inside every discount button: the code is in the link already. */
function CodeNote({ lang }: { lang: Lang }) {
  return (
    <span className="mt-0.5 block font-body text-[11px] font-normal leading-tight opacity-80">
      {PARTNER_COPY[lang].codeNote.replace("{code}", PARTNER_OFFER.code)}
    </span>
  );
}

/** Rules of the task game: before the first round, and again on demand. */
function TaskIntro({ lang, cta, onGo }: { lang: Lang; cta: string; onGo: () => void }) {
  const c = TASK_COPY[lang];
  return (
    <div className="grid content-center gap-5 py-6 text-center animate-fade-up">
      <p className="font-heading text-3xl leading-tight">{c.introTitle}</p>
      <ul className="grid gap-3 text-base leading-snug">
        <li className="text-sm opacity-90">{c.introWhat}</li>
        <li className="font-heading">{c.introTask.replace("{n}", String(TARGET))}</li>
        <li>{c.introDistract}</li>
        <li>{c.introFokus}</li>
        <li className="font-heading text-sm" style={{ color: "#ffd34d" }}>
          {c.introCollect}
        </li>
      </ul>
      <button
        type="button"
        onClick={onGo}
        className="justify-self-center border-2 px-8 py-3 font-heading text-lg"
        style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
      >
        {cta}
      </button>
    </div>
  );
}

/**
 * Full-screen layer for the mini game: the page behind is locked so swipes
 * never scroll it (real Fullscreen API is not available on iPhone Safari).
 * Rendered via a portal — an animated ancestor would otherwise trap
 * `position: fixed`. Still clearly labelled as an ad; ✕ or Esc closes it.
 */
function GameLayer({
  lang,
  tutorial,
  discovered,
  onClose,
}: {
  lang: Lang;
  tutorial: boolean;
  discovered: Set<number>;
  onClose: () => void;
}) {
  const c = CHALLENGE_COPY[lang];
  const t = PARTNER_COPY[lang];
  const layerRef = useRef<HTMLDivElement>(null);
  // first open: a start screen that says "this is a game" before anything moves
  const [intro, setIntro] = useState(tutorial);
  const [help, setHelp] = useState(false); // tutorial reopened mid-game

  useEffect(() => {
    const html = document.documentElement;
    const prev = {
      overflow: html.style.overflow,
      overscroll: html.style.overscrollBehavior,
      body: document.body.style.overflow,
    };
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    const back = document.activeElement as HTMLElement | null;
    layerRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev.overflow;
      html.style.overscrollBehavior = prev.overscroll;
      document.body.style.overflow = prev.body;
      window.removeEventListener("keydown", onKey);
      back?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={layerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${c.title} – ${t.label}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 touch-none overflow-hidden outline-none animate-fade-up"
      style={{
        backgroundColor: BLUE,
        color: CREAM,
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
      }}
    >
      <div className="relative mx-auto grid h-full max-w-[420px] content-start gap-3">
        <div className="flex items-center justify-between gap-3">
          <Logo variant="cream" className="h-5" />
          <div className="flex items-center gap-3">
            <AdLabel lang={lang} className="opacity-80" />
            <button
              type="button"
              onClick={onClose}
              aria-label={c.close}
              className="flex h-10 w-10 items-center justify-center border-2 text-lg leading-none"
              style={{ borderColor: CREAM }}
            >
              ✕
            </button>
          </div>
        </div>
        {intro && PARTNER_OFFER.game === "arcade" ? (
          <div className="grid content-center gap-5 py-6 text-center animate-fade-up">
            <p className="font-heading text-3xl leading-tight">{c.introTitle}</p>
            <ul className="grid gap-3 text-base leading-snug">
              <li>{c.introGoal}</li>
              <li className="font-heading">
                {c.introFind.replace("{n}", String(DISTRACTIONS.length))}
              </li>
              <li>{c.introFunny}</li>
            </ul>
            <button
              type="button"
              onClick={() => setIntro(false)}
              className="justify-self-center border-2 px-8 py-3 font-heading text-lg"
              style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
            >
              {c.introGo}
            </button>
          </div>
        ) : PARTNER_OFFER.game === "task" ? (
          <>
            {/* user tests: people skip the intro, then don't know what's going on */}
            <button
              type="button"
              onClick={() => setHelp(true)}
              className="justify-self-start rounded-full border-2 px-3 py-1 text-xs font-bold"
              style={{ borderColor: "#ffd34d", color: "#ffd34d" }}
            >
              {TASK_COPY[lang].help}
            </button>
            {help && (
              // over the paused game, which keeps its state underneath
              <div
                className="absolute inset-x-0 bottom-0 top-11 z-50"
                style={{ backgroundColor: BLUE }}
              >
                <TaskIntro
                  lang={lang}
                  cta={TASK_COPY[lang].helpResume}
                  onGo={() => setHelp(false)}
                />
              </div>
            )}
            <FokusTaskGame
              lang={lang}
              paused={help}
              tutorial={tutorial}
              discovered={discovered}
              onExit={onClose}
              endCta={
                <PartnerLink
                  placement="results-card"
                  className="justify-self-center border-2 px-5 py-2.5 font-heading text-sm"
                  style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
                >
                  {t.cardCta} ↗
                  <CodeNote lang={lang} />
                </PartnerLink>
              }
            />
          </>
        ) : (
          <FokusChallenge
            lang={lang}
            tutorial={tutorial}
            discovered={discovered}
            onExit={onClose}
            endCta={
              <PartnerLink
                placement="results-card"
                className="justify-self-center border-2 px-5 py-2.5 font-heading text-sm"
                style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
              >
                {t.cardCta} ↗
                <CodeNote lang={lang} />
              </PartnerLink>
            }
          />
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * Ad card shown directly below the result list. Deliberately calm: user
 * tests found the buzzing phone and the ghost hand pushy, almost scammy —
 * so no motion here; the game only starts when someone asks for it.
 */
export function PartnerCard({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [played, setPlayed] = useState(false); // tutorial only in the first game
  const [discovered] = useState(() => new Set<number>()); // collection across rounds, page only
  const closeGame = useCallback(() => {
    setPlayed(true);
    setOpen(false);
  }, []);
  if (!PARTNER_OFFER.enabled) return null;
  const t = PARTNER_COPY[lang];
  return (
    <aside
      aria-label={t.label}
      className="mt-5 grid gap-3 overflow-hidden border-poster p-4 sm:p-5"
      style={{ backgroundColor: BLUE, color: CREAM }}
    >
      <div className="flex items-center justify-between gap-3">
        <Logo variant="cream" className="h-4 sm:h-5" />
        <AdLabel lang={lang} className="opacity-80" />
      </div>
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          <FokusDevice size={56} />
        </span>
        <div className="grid min-w-0 gap-1">
          <p className="font-heading text-base leading-tight sm:text-lg">{t.cardTitle}</p>
          <p className="text-sm leading-snug opacity-85">{t.gamePitch}</p>
        </div>
      </div>
      {open && (
        <GameLayer lang={lang} tutorial={!played} discovered={discovered} onClose={closeGame} />
      )}
      <div className="grid gap-2 sm:flex sm:items-center">
        <button
          type="button"
          onClick={() => {
            track(EVENTS.partnerPlay, { partner: PARTNER_OFFER.id, action: "open" });
            setOpen(true);
          }}
          className="border-2 px-5 py-3 text-center font-heading text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
        >
          {t.startGame}
        </button>
        <PartnerLink
          placement="results-card"
          className="border-2 px-5 py-2.5 text-center font-heading text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "transparent", color: CREAM, borderColor: CREAM }}
        >
          {t.cardCta} ↗
          <CodeNote lang={lang} />
        </PartnerLink>
      </div>
    </aside>
  );
}
