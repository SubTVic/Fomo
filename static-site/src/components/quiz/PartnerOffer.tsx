// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics";
import { PARTNER_COPY, PARTNER_OFFER, type PartnerPlacement } from "@/lib/partner";

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

/** Ad card shown directly below the result list (variant 1). */
export function PartnerCard({ lang }: { lang: Lang }) {
  if (!PARTNER_OFFER.enabled) return null;
  const t = PARTNER_COPY[lang];
  return (
    <aside aria-label={t.label} className="mt-5 grid gap-4 border-poster p-5 sm:p-6" style={{ backgroundColor: BLUE, color: CREAM }}>
      <div className="flex items-center justify-between gap-3">
        <Logo variant="cream" className="h-5 sm:h-6" />
        <AdLabel lang={lang} className="opacity-80" />
      </div>
      <p className="font-heading text-lg leading-tight sm:text-xl">{t.cardTitle}</p>
      <p className="max-w-[680px] text-sm leading-relaxed opacity-90 sm:text-base">{t.cardText}</p>
      <PartnerLink
        placement="results-card"
        className="border-2 px-6 py-3 text-center font-heading transition-opacity hover:opacity-90 sm:justify-self-start"
        style={{ backgroundColor: CREAM, color: BLUE, borderColor: CREAM }}
      >
        {t.cardCta} →
      </PartnerLink>
    </aside>
  );
}

/** Coupon with a copyable code, shown above the feedback box (variant 3). */
export function PartnerCoupon({ lang }: { lang: Lang }) {
  const [copied, setCopied] = useState(false);
  if (!PARTNER_OFFER.enabled) return null;
  const t = PARTNER_COPY[lang];

  async function copyCode() {
    track(EVENTS.partnerCodeCopy, { partner: PARTNER_OFFER.id });
    try {
      await navigator.clipboard.writeText(PARTNER_OFFER.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the code stays visible and selectable
    }
  }

  return (
    <aside
      aria-label={t.label}
      className="mt-8 grid gap-3 border-poster p-5 sm:grid-cols-[1fr_auto] sm:items-center"
      style={{ backgroundColor: CREAM, color: BLUE }}
    >
      <div className="grid gap-2">
        <div className="flex items-center gap-3">
          <Logo variant="blue" className="h-4" />
          <AdLabel lang={lang} className="opacity-70" />
        </div>
        <p className="font-heading text-base sm:text-lg">{t.couponTitle}</p>
        <p className="text-sm">{t.couponText}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="select-all border-2 border-dashed px-3 py-1.5 font-mono text-lg font-bold tracking-wider"
          style={{ borderColor: BLUE }}
        >
          {PARTNER_OFFER.code}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="border-2 bg-white px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ borderColor: BLUE, color: BLUE }}
        >
          {copied ? t.copied : t.copy}
        </button>
        <PartnerLink
          placement="results-coupon"
          className="border-2 px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE, color: CREAM, borderColor: BLUE }}
        >
          {t.couponCta} →
        </PartnerLink>
      </div>
    </aside>
  );
}
