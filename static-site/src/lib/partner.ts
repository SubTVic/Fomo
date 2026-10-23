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
  /** Which mini game the ad opens: "task" (prototype: do a task despite
   *  distractions, the tag blocks them) or "arcade" (endless swipe-away round). */
  game: "task" as "task" | "arcade",
} as const;

export type PartnerPlacement = "results-card";

export const PARTNER_COPY = {
  de: {
    label: "Anzeige",
    cardTitle: "Gruppe gefunden. Jetzt noch den Kopf frei fürs Semester.",
    gamePitch: "Kurzes Minispiel: Schaffst du deine Lernsession trotz Handy-Ablenkungen?",
    cardCta: "Zum Rabatt",
    startGame: "▶ Minispiel starten",
  },
  en: {
    label: "Ad",
    cardTitle: "Found your group. Now clear your head for the semester.",
    gamePitch: "Quick mini game: can you finish your study session despite your phone?",
    cardCta: "Get the discount",
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

/** Copy for the "task" prototype: tap 1–20 while notifications get in the way. */
export const TASK_COPY = {
  de: {
    introTitle: "🎮 Deine Lernsession",
    introTask: "Tippe die Zahlen 1 bis {n} der Reihe nach.",
    introDistract: "Benachrichtigungen lenken dich ab – wisch sie weg …",
    introFokus: "… oder tipp deinen FOKUS-Tag: Ruhe, und du kommst voran.",
    introCollect: "🔍 Und: Sammle alle Nachrichten – z. B. alle von deinem Ex 💔",
    introGo: "Session starten ▶",
    help: "🤷 Tutorial übersprungen? Hier nochmal lesen",
    helpResume: "Weiter spielen ▶",
    task: "Aufgabe: 1 bis {n} antippen",
    time: "Zeit",
    nextLabel: "nächste",
    done: "geschafft",
    focusMode: "Fokus-Modus",
    focusing: "🔒 Keine Ablenkung – jetzt durchziehen!",
    tagHint: "FOKUS-Tag: Ablenkungen blockieren",
    tagHintBusy: "Zu viel los? Tipp deinen FOKUS-Tag!",
    recharging: "FOKUS-Tag lädt …",
    tagAria: "FOKUS-Tag antippen: Benachrichtigungen 8 Sekunden blockieren",
    won: "Lernsession geschafft! 🎉",
    wonDismissed: "Du hast {n} Benachrichtigungen selbst weggeklickt. 😮‍💨",
    wonPunch: "Anstrengend, oder? FOKUS macht das für dich.",
    best: "Bestzeit",
    focusUsed: "{n}× Fokus-Modus",
    again: "↺ Nochmal",
    exit: "✕ Spiel beenden",
    isNew: "neu",
    setDone: "Sammlung komplett:",
    unlocked: "Komplett:",
    collection: "📖 Sammlung {x}/{n}",
    collectionTitle: "Deine Sammlung",
    collectionNote: "Gilt für diesen Besuch. Jede Runde zeigt zuerst Neues.",
    locked: "???",
    back: "← Zurück",
  },
  en: {
    introTitle: "🎮 Your study session",
    introTask: "Tap the numbers 1 to {n} in order.",
    introDistract: "Notifications get in the way – swipe them off …",
    introFokus: "… or tap your FOKUS tag: quiet, and you get things done.",
    introCollect: "🔍 Plus: collect every message – e.g. all from your ex 💔",
    introGo: "Start session ▶",
    help: "🤷 Skipped the tutorial? Read it here",
    helpResume: "Keep playing ▶",
    task: "Task: tap 1 to {n}",
    time: "time",
    nextLabel: "next",
    done: "done",
    focusMode: "Focus mode",
    focusing: "🔒 No distractions – push through now!",
    tagHint: "FOKUS tag: block distractions",
    tagHintBusy: "Too much going on? Tap your FOKUS tag!",
    recharging: "FOKUS tag charging …",
    tagAria: "Tap the FOKUS tag: block notifications for 8 seconds",
    won: "Study session done! 🎉",
    wonDismissed: "You swiped away {n} notifications yourself. 😮‍💨",
    wonPunch: "Exhausting, right? FOKUS does it for you.",
    best: "Best",
    focusUsed: "{n}× focus mode",
    again: "↺ Again",
    exit: "✕ End game",
    isNew: "new",
    setDone: "Collection complete:",
    unlocked: "Complete:",
    collection: "📖 Collection {x}/{n}",
    collectionTitle: "Your collection",
    collectionNote: "For this visit. Each round shows new ones first.",
    locked: "???",
    back: "← Back",
  },
} as const;
