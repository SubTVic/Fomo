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
 * <PartnerCard> usage in ResultsScreen).
 */
export const PARTNER_OFFER = {
  enabled: true,
  id: "fokus",
  name: "FOKUS",
  /** Affiliate link; already carries the discount code. */
  url: "https://gofokus.com/discount/FOMO26",
  code: "FOMO26",
} as const;

export type PartnerPlacement = "results-card";

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

/** Copy for the endless "Fokus-Minispiel" round inside the ad. */
export const CHALLENGE_COPY = {
  de: {
    title: "Fokus-Minispiel",
    go: "Los! 🔥 Handy voll? Schnell den FOKUS-Tag!",
    practice: "Übung",
    tutTap: "👆 Tipp oder wisch Ablenkungen weg – bevor dein Handy voll ist.",
    tutGroup: "★ Das ist deine Gruppe – stehen lassen! Wegtippen lähmt dich.",
    tutTag: "Dein FOKUS-Tag ist geladen. Tipp drauf: alles weg, doppelte Punkte, Pause.",
    close: "Spiel schließen",
    blocked: "geblockt",
    points: "Punkte",
    best: "Bestwert",
    tagCharging: "FOKUS-Tag lädt",
    tagReady: "FOKUS-Tag bereit – antippen!",
    tagged: "Alles weg! +{n} 🔒",
    burst: "📢 Gruppenchat explodiert!",
    tagAria: "FOKUS-Tag einsetzen und alle Ablenkungen blocken",
    calm: "Fokus-Modus",
    breathe: "Atme tief durch …",
    focus: "Fokus.",
    resume: "Gleich geht’s weiter",
    qteNow: "JETZT! 🚨",
    qteTapOnce: "Tipp den FOKUS-Tag!",
    qteTapMany: "Tipp den FOKUS-Tag {n}×!",
    oops: "Das war deine Gruppe! −5",
    stunned: "😵 Gelähmt!",
    seen: "Gruppe gesehen +2",
    survived: "durchgehalten",
    lostAfter: "Abgelenkt nach",
    endLine: "Im echten Alltag übernimmt das der FOKUS-Tag für dich.",
    again: "↺ Nochmal",
    exit: "✕ Spiel beenden",
  },
  en: {
    title: "Focus mini game",
    go: "Go! 🔥 Phone full? Quick, the FOKUS tag!",
    practice: "Practice",
    tutTap: "👆 Tap or swipe distractions away – before your phone fills up.",
    tutGroup: "★ That's your group – leave it! Tapping it stuns you.",
    tutTag: "Your FOKUS tag is charged. Tap it: all gone, double points, a break.",
    close: "Close game",
    blocked: "blocked",
    points: "points",
    best: "Best",
    tagCharging: "FOKUS tag charging",
    tagReady: "FOKUS tag ready – tap it!",
    tagged: "All gone! +{n} 🔒",
    burst: "📢 Group chat exploding!",
    tagAria: "Use the FOKUS tag and block all distractions",
    calm: "Focus mode",
    breathe: "Take a deep breath …",
    focus: "Focus.",
    resume: "Back in",
    qteNow: "NOW! 🚨",
    qteTapOnce: "Tap the FOKUS tag!",
    qteTapMany: "Tap the FOKUS tag {n}×!",
    oops: "That was your group! −5",
    stunned: "😵 Stunned!",
    seen: "Group message seen +2",
    survived: "survived",
    lostAfter: "Distracted after",
    endLine: "In real life, the FOKUS tag does this for you.",
    again: "↺ Again",
    exit: "✕ End game",
  },
} as const;
