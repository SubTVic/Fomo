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
    blocked: "Ablenkungen blockiert",
    danger: "Achtung: Ablenkungen!",
    again: "Nochmal",
    cardCta: "Zum Rabatt",
    gameBadge: "🎮 Minispiel",
    startGame: "▶ Minispiel starten",
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
    blocked: "Distractions blocked",
    danger: "Danger: distractions!",
    again: "Again",
    cardCta: "Get the discount",
    gameBadge: "🎮 Mini game",
    startGame: "▶ Play the mini game",
  },
} as const;

/** Copy for the endless "Fokus-Minispiel" round inside the ad. */
export const CHALLENGE_COPY = {
  de: {
    title: "Fokus-Minispiel",
    introTitle: "🎮 Das ist ein Spiel!",
    introGoal: "Ziel: Wisch alle Benachrichtigungen weg und knack den Highscore.",
    introFind: "Findest du alle {n} Benachrichtigungen? 🔍",
    introFunny: "Welche ist die lustigste? 😂",
    introGo: "Los geht’s ▶",
    discovered: "Entdeckt: {x}/{n} 🔍",
    go: "Los! 🔥",
    practice: "Übung",
    tutTap: "👆 Tippe, um die Benachrichtigung zu entfernen.",
    tutGroup: "★ = deine Gruppe. Stehen lassen! Nur mich wegwischen.",
    tutCharge: "⚡ Wegwischen lädt deinen FOKUS-Tag unten.",
    tutTag: "Zu viel auf einmal? Tipp auf deinen Tag 👇",
    close: "Spiel schließen",
    points: "Punkte",
    best: "Bestwert",
    tagReady: "⚡ Tag bereit!",
    tutTagShort: "Tag antippen = alles weg!",
    tagged: "+{n} 🔒",
    burst: "📢 Gruppenchat!",
    tagAria: "FOKUS-Tag einsetzen und alle Ablenkungen blocken",
    breatheIn: "einatmen",
    breatheOut: "ausatmen",
    oops: "Deine Gruppe! −5",
    stunned: "😵 Gelähmt",
    seen: "★ +2",
    survived: "durchgehalten",
    lostAfter: "Abgelenkt nach",
    again: "↺ Nochmal",
    exit: "✕ Spiel beenden",
  },
  en: {
    title: "Focus mini game",
    introTitle: "🎮 It's a game!",
    introGoal: "Goal: swipe away every notification and beat the high score.",
    introFind: "Can you find all {n} notifications? 🔍",
    introFunny: "Which one is the funniest? 😂",
    introGo: "Let's go ▶",
    discovered: "Found: {x}/{n} 🔍",
    go: "Go! 🔥",
    practice: "Practice",
    tutTap: "👆 Tap to remove the notification.",
    tutGroup: "★ = your group. Leave it! Only swipe me.",
    tutCharge: "⚡ Swiping charges your FOKUS tag below.",
    tutTag: "Too much at once? Tap your tag 👇",
    close: "Close game",
    points: "points",
    best: "Best",
    tagReady: "⚡ Tag ready!",
    tutTagShort: "Tap the tag = all gone!",
    tagged: "+{n} 🔒",
    burst: "📢 Group chat!",
    tagAria: "Use the FOKUS tag and block all distractions",
    breatheIn: "breathe in",
    breatheOut: "breathe out",
    oops: "Your group! −5",
    stunned: "😵 Stunned",
    seen: "★ +2",
    survived: "survived",
    lostAfter: "Distracted after",
    again: "↺ Again",
    exit: "✕ End game",
  },
} as const;
