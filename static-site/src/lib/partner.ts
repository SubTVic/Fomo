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
    gameHint: "Zieh den Tag aufs Handy.",
    gameSafe: "Nur ein Spiel, hier öffnet sich nichts.",
    gameDrop: "hier hin",
    gameTag: "Tag",
    gameTagAria: "FOKUS-Tag ans Handy halten",
    focusOn: "Fokus-Modus an",
    blocked: "Ablenkungen geblockt",
    again: "Nochmal",
    cardText:
      "Der FOKUS-Tag sperrt ablenkende Apps wie TikTok oder Instagram, bis du ihn an dein iPhone hältst. Mit Code FOMO26 bekommst du Rabatt.",
    cardCta: "Zum Rabatt",
    couponTitle: "Rabatt-Code für den FOKUS-Tag",
    couponText: "Reiß den Gutschein ab, dann ist dein Code kopiert.",
    tear: "Abreißen",
    tearAria: "Gutschein abreißen und Rabatt-Code kopieren",
    torn: "Code kopiert. Im FOKUS-Shop einfügen.",
    tornNoClipboard: "Im FOKUS-Shop einfügen.",
    copy: "Nochmal kopieren",
    copied: "Kopiert",
    couponCta: "Zum Shop",
  },
  en: {
    label: "Ad",
    cardTitle: "Found your group. Now clear your head for the semester.",
    gameHint: "Drag the tag onto the phone.",
    gameSafe: "Just a game, nothing opens here.",
    gameDrop: "drop here",
    gameTag: "Tag",
    gameTagAria: "Hold the FOKUS tag to the phone",
    focusOn: "Focus mode on",
    blocked: "distractions blocked",
    again: "Again",
    cardText:
      "The FOKUS tag blocks distracting apps like TikTok or Instagram until you hold it to your iPhone. Code FOMO26 gets you a discount.",
    cardCta: "Get the discount",
    couponTitle: "Discount code for the FOKUS tag",
    couponText: "Tear off the coupon and your code is copied.",
    tear: "Tear off",
    tearAria: "Tear off the coupon and copy the discount code",
    torn: "Code copied. Paste it in the FOKUS shop.",
    tornNoClipboard: "Enter it in the FOKUS shop.",
    copy: "Copy again",
    copied: "Copied",
    couponCta: "Go to shop",
  },
} as const;

/** Fake notifications for the mini game in the results ad (cycled in order). */
export const GAME_NOTIFICATIONS: Record<"de" | "en", Array<{ app: string; color: string; text: string }>> = {
  de: [
    { app: "TikTok", color: "#111111", text: "12 neue Videos für dich" },
    { app: "WhatsApp", color: "#25d366", text: "47 Nachrichten in „Erstis 2026“" },
    { app: "Instagram", color: "#e1306c", text: "@lena hat eine Story gepostet" },
    { app: "YouTube", color: "#ff0000", text: "Neues Video: „10 Hacks fürs Studium“" },
    { app: "Snapchat", color: "#f5c400", text: "3 neue Snaps" },
    { app: "BeReal", color: "#333333", text: "Zeit für dein BeReal!" },
    { app: "Instagram", color: "#e1306c", text: "Das könnte dir gefallen …" },
    { app: "WhatsApp", color: "#25d366", text: "Mama: Hast du schon gegessen?" },
  ],
  en: [
    { app: "TikTok", color: "#111111", text: "12 new videos for you" },
    { app: "WhatsApp", color: "#25d366", text: "47 messages in “Freshers 2026”" },
    { app: "Instagram", color: "#e1306c", text: "@lena posted a story" },
    { app: "YouTube", color: "#ff0000", text: "New video: “10 study hacks”" },
    { app: "Snapchat", color: "#f5c400", text: "3 new snaps" },
    { app: "BeReal", color: "#333333", text: "Time to BeReal!" },
    { app: "Instagram", color: "#e1306c", text: "You might like this …" },
    { app: "WhatsApp", color: "#25d366", text: "Mum: Have you eaten yet?" },
  ],
};
