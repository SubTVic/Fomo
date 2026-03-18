// SPDX-License-Identifier: AGPL-3.0-only
// Static theses for the demo — always works regardless of DB state.
// Keep in sync with skripte/quiz-thesen.json

import type { QuizThesisData } from "@/lib/quiz/types";

export const DEMO_THESES: QuizThesisData[] = [
  {
    id: "demo-01",
    shortTitle: "Zeitaufwand",
    text: "Ich bin bereit, mehr als 5 Stunden pro Woche für eine Hochschulgruppe zu investieren.",
    order: 1,
    attributes: [{ attribute: "timeLow", isInverse: true }],
  },
  {
    id: "demo-02",
    shortTitle: "Karriere",
    text: "Mir ist wichtig, durch mein Engagement meine Karrierechancen zu verbessern.",
    order: 2,
    attributes: [{ attribute: "career", isInverse: false }],
  },
  {
    id: "demo-03",
    shortTitle: "Technik",
    text: "Ich interessiere mich für Technik, IT, Robotik oder digitale Themen.",
    order: 3,
    attributes: [{ attribute: "tech", isInverse: false }],
  },
  {
    id: "demo-04",
    shortTitle: "Gesellschaft",
    text: "Gesellschaftliche Probleme aktiv anzugehen ist mir wichtig.",
    order: 4,
    attributes: [{ attribute: "socialImpact", isInverse: false }],
  },
  {
    id: "demo-05",
    shortTitle: "Socializing",
    text: "Ich suche eine Gruppe, bei der gemeinsames Feiern und Socializing dazugehören.",
    order: 5,
    attributes: [{ attribute: "party", isInverse: false }],
  },
  {
    id: "demo-06",
    shortTitle: "Glaube",
    text: "Ein gemeinsamer Glaube oder eine gemeinsame Weltanschauung ist mir bei einer Gruppe wichtig.",
    order: 6,
    attributes: [{ attribute: "religion", isInverse: false }],
  },
  {
    id: "demo-07",
    shortTitle: "Sport",
    text: "Regelmäßig Sport zu treiben oder körperlich aktiv zu sein ist mir wichtig.",
    order: 7,
    attributes: [{ attribute: "sports", isInverse: false }],
  },
  {
    id: "demo-08",
    shortTitle: "Netzwerk",
    text: "Berufliche und persönliche Kontakte zu knüpfen ist ein wichtiges Ziel für mich.",
    order: 8,
    attributes: [{ attribute: "networking", isInverse: false }],
  },
  {
    id: "demo-09",
    shortTitle: "Kunst",
    text: "Kreatives Gestalten — ob Theater, Kunst, Fotografie oder Design — begeistert mich.",
    order: 9,
    attributes: [{ attribute: "arts", isInverse: false }],
  },
  {
    id: "demo-10",
    shortTitle: "Musik",
    text: "Musik aktiv zu machen — ob Chor, Band oder Orchester — ist mir wichtig.",
    order: 10,
    attributes: [{ attribute: "music", isInverse: false }],
  },
  {
    id: "demo-11",
    shortTitle: "Praktisches Tun",
    text: "Ich lerne und arbeite lieber durch praktisches Tun als durch Diskussion und Theorie.",
    order: 11,
    attributes: [{ attribute: "handsOn", isInverse: false }],
  },
  {
    id: "demo-12",
    shortTitle: "Outdoor",
    text: "Aktivitäten im Freien und in der Natur sprechen mich besonders an.",
    order: 12,
    attributes: [{ attribute: "outdoor", isInverse: false }],
  },
  {
    id: "demo-13",
    shortTitle: "International",
    text: "Ich möchte internationale Studierende kennenlernen und mich in anderen Sprachen austauschen.",
    order: 13,
    attributes: [{ attribute: "international", isInverse: false }],
  },
  {
    id: "demo-14",
    shortTitle: "Einstieg",
    text: "Ich bevorzuge Gruppen, bei denen man ohne Vorkenntnisse direkt mitmachen kann.",
    order: 14,
    attributes: [{ attribute: "beginnerFriendly", isInverse: false }],
  },
  {
    id: "demo-15",
    shortTitle: "Wettbewerb",
    text: "Wettbewerbe und das Messen mit anderen — ob beim Sport, Hackathon oder Debatte — motivieren mich.",
    order: 15,
    attributes: [{ attribute: "competitive", isInverse: false }],
  },
  {
    id: "demo-16",
    shortTitle: "Kosten",
    text: "Mitgliedsbeiträge oder Kosten für Ausrüstung und Veranstaltungen sind für mich kein Problem.",
    order: 16,
    attributes: [{ attribute: "financialCost", isInverse: false }],
  },
  {
    id: "demo-17",
    shortTitle: "Verantwortung",
    text: "Ich möchte innerhalb einer Gruppe Verantwortung übernehmen und eigene Ideen voranbringen.",
    order: 17,
    attributes: [{ attribute: "leadershipOpportunities", isInverse: false }],
  },
  {
    id: "demo-18",
    shortTitle: "Karriere & Netzwerk",
    text: "Neben dem Spaß ist es mir wichtig, für meinen Berufsstart relevante Kontakte zu knüpfen.",
    order: 18,
    attributes: [
      { attribute: "career", isInverse: false },
      { attribute: "networking", isInverse: false },
    ],
  },
  {
    id: "demo-19",
    shortTitle: "Bauen & Wettbewerb",
    text: "Ich baue, programmiere oder konstruiere gerne — und trete dabei auch in Wettbewerben an.",
    order: 19,
    attributes: [
      { attribute: "handsOn", isInverse: false },
      { attribute: "competitive", isInverse: false },
    ],
  },
  {
    id: "demo-20",
    shortTitle: "Kunst & Musik",
    text: "Kunst, Musik oder kreative Projekte sind ein wichtiger Teil meines Lebens.",
    order: 20,
    attributes: [
      { attribute: "arts", isInverse: false },
      { attribute: "music", isInverse: false },
    ],
  },
];
