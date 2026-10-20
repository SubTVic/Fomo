// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics";
import { PARTNER_COPY, PARTNER_OFFER, type PartnerPlacement } from "@/lib/partner";

type Lang = "de" | "en";

function AdLabel({ lang }: { lang: Lang }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-body">
      <span className="border-2 border-current px-1.5">{PARTNER_COPY[lang].label}</span>
      <span>{PARTNER_OFFER.name}</span>
    </p>
  );
}

function PartnerLink({
  placement,
  className,
  children,
}: {
  placement: PartnerPlacement;
  className: string;
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
    <aside aria-label={t.label} className="mt-5 grid gap-3 border-poster bg-[#f6f6f2] p-5">
      <AdLabel lang={lang} />
      <p className="font-heading text-lg leading-tight text-navy sm:text-xl">{t.cardTitle}</p>
      <p className="max-w-[680px] text-sm leading-relaxed text-body sm:text-base">{t.cardText}</p>
      <PartnerLink
        placement="results-card"
        className="border-poster bg-navy px-6 py-3 text-center font-heading text-sky transition-colors hover:bg-navy-hover sm:justify-self-start"
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
    <aside aria-label={t.label} className="mt-8 grid gap-2">
      <AdLabel lang={lang} />
      <div className="grid gap-3 border-poster border-dashed bg-[#ffe14d] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid gap-1">
          <p className="font-heading text-base text-navy sm:text-lg">{t.couponTitle}</p>
          <p className="text-sm text-navy">{t.couponText}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="select-all border-2 border-navy bg-card px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-navy">
            {PARTNER_OFFER.code}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="border-2 border-navy bg-card px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-surface"
          >
            {copied ? t.copied : t.copy}
          </button>
          <PartnerLink
            placement="results-coupon"
            className="border-2 border-navy bg-navy px-3 py-2 text-sm font-semibold text-sky transition-colors hover:bg-navy-hover"
          >
            {t.couponCta} →
          </PartnerLink>
        </div>
      </div>
    </aside>
  );
}
