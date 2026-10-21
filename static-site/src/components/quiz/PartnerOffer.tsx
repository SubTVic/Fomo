// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { track, EVENTS } from "@/lib/analytics";
import { CHALLENGE_COPY, PARTNER_COPY, PARTNER_OFFER, type PartnerPlacement } from "@/lib/partner";
import { FokusChallenge } from "./FokusChallenge";
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
function GameLayer({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const c = CHALLENGE_COPY[lang];
  const t = PARTNER_COPY[lang];
  const layerRef = useRef<HTMLDivElement>(null);

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
        <FokusChallenge
          lang={lang}
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
      </div>
    </div>,
    document.body,
  );
}

/** Ad card shown directly below the result list (variant 1). */
export function PartnerCard({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<"demo" | "challenge">("demo");
  const closeGame = useCallback(() => setMode("demo"), []);
  if (!PARTNER_OFFER.enabled) return null;
  const t = PARTNER_COPY[lang];
  return (
    <aside
      aria-label={t.label}
      className="mt-5 grid gap-4 overflow-hidden border-poster p-5 sm:p-6"
      style={{ backgroundColor: BLUE, color: CREAM }}
    >
      <div className="flex items-center justify-between gap-3">
        <Logo variant="cream" className="h-5 sm:h-6" />
        <AdLabel lang={lang} className="opacity-80" />
      </div>
      <p className="font-heading text-lg leading-tight sm:text-xl">{t.cardTitle}</p>
      {/* remounting the demo after the game resets it to its idle state */}
      <FokusTagGame key={mode} lang={lang} onChallenge={mode === "demo" ? () => setMode("challenge") : undefined} />
      {mode === "challenge" && <GameLayer lang={lang} onClose={closeGame} />}
      <p className="max-w-[680px] text-sm leading-relaxed opacity-90 sm:text-base">{t.cardText}</p>
      <PartnerLink
        placement="results-card"
        className="border-2 px-6 py-3 text-center font-heading transition-opacity hover:opacity-90 sm:justify-self-start"
        style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
      >
        {t.cardCta} ↗
      </PartnerLink>
    </aside>
  );
}
