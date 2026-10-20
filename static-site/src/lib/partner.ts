// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Paid partner placement on the results page (FOKUS, autumn 2026).
 *
 * Rules that keep this honest:
 * - Always labelled as an ad ("Anzeige"/"Ad") and visually separate from groups.
 * - A plain link: no partner script, pixel or cookie. Clicks are counted only
 *   as an anonymous Umami event (`partner-click`, placement only).
 * - Never touches matching or ranking — it is rendered after the list.
 *
 * To end the campaign set `enabled: false` (or delete this file and the
 * <PartnerCard>/<PartnerCoupon> usages in ResultsScreen).
 */
export const PARTNER_OFFER = {
  enabled: true,
  id: "fokus",
  name: "FOKUS",
  /** Affiliate link; already carries the discount code. */
  url: "https://gofokus.com/discount/FOMO26",
  code: "FOMO26",
} as const;

export type PartnerPlacement = "results-card" | "results-coupon";

export const PARTNER_COPY = {
  de: {
    label: "Anzeige",
    cardTitle: "Gruppe gefunden. Jetzt noch den Kopf frei fürs Semester.",
    cardText:
      "Der FOKUS-Tag sperrt ablenkende Apps wie TikTok oder Instagram, bis du ihn an dein iPhone hältst. Mit Code FOMO26 bekommst du Rabatt.",
    cardCta: "Zum Rabatt",
    couponTitle: "Rabatt-Code für den FOKUS-Tag",
    couponText: "Einfach im FOKUS-Shop eingeben.",
    copy: "Code kopieren",
    copied: "Kopiert",
    couponCta: "Zum Shop",
  },
  en: {
    label: "Ad",
    cardTitle: "Found your group. Now clear your head for the semester.",
    cardText:
      "The FOKUS tag blocks distracting apps like TikTok or Instagram until you hold it to your iPhone. Code FOMO26 gets you a discount.",
    cardCta: "Get the discount",
    couponTitle: "Discount code for the FOKUS tag",
    couponText: "Enter it in the FOKUS shop.",
    copy: "Copy code",
    copied: "Copied",
    couponCta: "Go to shop",
  },
} as const;
