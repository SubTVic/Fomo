// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { track, EVENTS } from "@/lib/analytics";
import { CHALLENGE_COPY, PARTNER_COPY, PARTNER_OFFER, TASK_COPY, type PartnerPlacement } from "@/lib/partner";
import { DISTRACTIONS } from "@/lib/fokus-notifications";
import { FokusChallenge } from "./FokusChallenge";
import { FokusTaskGame, TARGET } from "./FokusTaskGame";
import { FokusTagGame } from "./FokusTagGame";

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

  useEffect(() => {
    const html = document.documentElement;
    const prev = { overflow: html.style.overflow, overscroll: html.style.overscrollBehavior, body: document.body.style.overflow };
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
      <div className="mx-auto grid h-full max-w-[420px] content-start gap-3">
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
        {intro && PARTNER_OFFER.game === "task" ? (
          <div className="grid content-center gap-5 py-6 text-center animate-fade-up">
            <p className="font-heading text-3xl leading-tight">{TASK_COPY[lang].introTitle}</p>
            <ul className="grid gap-3 text-base leading-snug">
              <li className="font-heading">{TASK_COPY[lang].introTask.replace("{n}", String(TARGET))}</li>
              <li>{TASK_COPY[lang].introDistract}</li>
              <li>{TASK_COPY[lang].introFokus}</li>
            </ul>
            <button
              type="button"
              onClick={() => setIntro(false)}
              className="justify-self-center border-2 px-8 py-3 font-heading text-lg"
              style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
            >
              {TASK_COPY[lang].introGo}
            </button>
          </div>
        ) : intro ? (
          <div className="grid content-center gap-5 py-6 text-center animate-fade-up">
            <p className="font-heading text-3xl leading-tight">{c.introTitle}</p>
            <ul className="grid gap-3 text-base leading-snug">
              <li>{c.introGoal}</li>
              <li className="font-heading">{c.introFind.replace("{n}", String(DISTRACTIONS.length))}</li>
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
          <FokusTaskGame
            lang={lang}
            discovered={discovered}
            onExit={onClose}
            endCta={
              <PartnerLink
                placement="results-card"
                className="justify-self-center border-2 px-5 py-2.5 font-heading text-sm"
                style={{ backgroundColor: "transparent", color: CREAM, borderColor: CREAM }}
              >
                {t.cardCta} ↗
              </PartnerLink>
            }
          />
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
                style={{ backgroundColor: "transparent", color: CREAM, borderColor: CREAM }}
              >
                {t.cardCta} ↗
              </PartnerLink>
            }
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Ad card shown directly below the result list (variant 1). */
export function PartnerCard({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<"demo" | "challenge">("demo");
  const [played, setPlayed] = useState(false); // tutorial only in the first game
  const [discovered] = useState(() => new Set<number>()); // collection across rounds, page only
  const closeGame = useCallback(() => {
    setPlayed(true);
    setMode("demo");
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
        <div className="flex min-w-0 items-center gap-2">
          <Logo variant="cream" className="h-4 sm:h-5" />
          {/* user test: people took the card for a plain ad — say it's a game */}
          <span className="whitespace-nowrap rounded-full px-2 py-0.5 font-heading text-[10px] uppercase tracking-wider" style={{ backgroundColor: "#ffd34d", color: BLUE }}>
            {t.gameBadge}
          </span>
        </div>
        <AdLabel lang={lang} className="opacity-80" />
      </div>
      <p className="font-heading text-base leading-tight sm:text-lg">{t.cardTitle}</p>
      {/* remounting the demo after the game resets it to its idle state */}
      <FokusTagGame key={mode} lang={lang} onChallenge={mode === "demo" ? () => setMode("challenge") : undefined} />
      {mode === "challenge" && <GameLayer lang={lang} tutorial={!played} discovered={discovered} onClose={closeGame} />}
      <button
        type="button"
        onClick={() => setMode("challenge")}
        className="border-2 px-5 py-3 text-center font-heading text-base transition-opacity hover:opacity-90"
        style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
      >
        {t.startGame}
      </button>
      <PartnerLink
        placement="results-card"
        className="border-2 px-5 py-2 text-center font-heading text-xs transition-opacity hover:opacity-90 sm:justify-self-start"
        style={{ backgroundColor: "transparent", color: CREAM, borderColor: CREAM }}
      >
        {t.cardCta} ↗
      </PartnerLink>
    </aside>
  );
}
