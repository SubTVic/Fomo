// SPDX-License-Identifier: AGPL-3.0-only

import type { LiveQuestion, GroupAttribute } from "./types";

/** Human-readable labels for each attribute (German UI) */
export const ATTRIBUTE_LABELS: Record<GroupAttribute, string> = {
  career: "Karriere",
  tech: "Technologie",
  language: "Sprachen",
  social_impact: "Gesellschaft",
  party: "Socializing",
  religion: "Glaube",
  sports: "Sport",
  networking: "Networking",
  arts: "Kreativ",
  music: "Musik",
  time_low: "Wenig Zeit",
  hands_on: "Hands-on",
  outdoor: "Outdoor",
  international: "International",
  beginner_friendly: "Einsteigerfreundlich",
  competitive: "Wettbewerb",
  event_frequency: "Regelmäßig",
  leadership_opportunities: "Verantwortung",
  group_size: "Große Gruppe",
};

/** The 20 quiz theses with attribute mappings */
export const LIVE_QUESTIONS: LiveQuestion[] = [
  {
    id: 1,
    shortTitle: "Zeitaufwand",
    thesis:
      "Ich kann mir vorstellen, mehr als 5 Stunden pro Woche für eine Hochschulgruppe aufzuwenden.",
    mappings: [
      { attribute: "time_low", inverse: true },
      { attribute: "event_frequency" },
    ],
  },
  {
    id: 2,
    shortTitle: "Verantwortung",
    thesis:
      "Ich möchte in einer Gruppe Verantwortung übernehmen, z.\u00A0B. als Projektleitung oder im Vorstand.",
    mappings: [{ attribute: "leadership_opportunities" }],
  },
  {
    id: 3,
    shortTitle: "Praktisch",
    thesis:
      "Ich lerne lieber durch praktisches Tun als durch Theorie und Diskussion.",
    mappings: [{ attribute: "hands_on" }],
  },
  {
    id: 4,
    shortTitle: "Werkstatt & Feld",
    thesis:
      "Ich bin gerne im Labor, in der Werkstatt oder direkt im Feld aktiv.",
    mappings: [{ attribute: "hands_on" }, { attribute: "outdoor" }],
  },
  {
    id: 5,
    shortTitle: "Networking",
    thesis:
      "Networking und der Aufbau beruflicher Kontakte sind mir in einer Gruppe wichtig.",
    mappings: [{ attribute: "networking" }, { attribute: "career" }],
  },
  {
    id: 6,
    shortTitle: "Kleine Gruppen",
    thesis:
      "Ich bevorzuge kleine, überschaubare Gruppen mit weniger als 20 aktiven Mitgliedern.",
    mappings: [{ attribute: "group_size", inverse: true }],
  },
  {
    id: 7,
    shortTitle: "Socializing",
    thesis:
      "Gemeinsame Feiern, Ausflüge und Socializing-Events sind für mich ein wichtiger Teil einer Gruppe.",
    mappings: [{ attribute: "party" }],
  },
  {
    id: 8,
    shortTitle: "Gesellschaft",
    thesis: "Ich möchte gesellschaftlichen Wandel aktiv mitgestalten.",
    mappings: [{ attribute: "social_impact" }],
  },
  {
    id: 9,
    shortTitle: "Hochschulpolitik",
    thesis:
      "Ich interessiere mich für Hochschulpolitik und studentische Mitbestimmung.",
    mappings: [{ attribute: "social_impact" }],
  },
  {
    id: 10,
    shortTitle: "Kreativität",
    thesis:
      "Kreatives Gestalten – Schreiben, Zeichnen, Fotografieren oder Musik – liegt mir sehr am Herzen.",
    mappings: [{ attribute: "arts" }, { attribute: "music" }],
  },
  {
    id: 11,
    shortTitle: "Kultur organisieren",
    thesis:
      "Kulturelle Veranstaltungen zu organisieren oder mitzugestalten macht mir Spaß.",
    mappings: [{ attribute: "arts" }],
  },
  {
    id: 12,
    shortTitle: "Glaube",
    thesis:
      "Mein Glaube oder meine Weltanschauung soll in der Gruppe eine sichtbare Rolle spielen.",
    mappings: [{ attribute: "religion" }],
  },
  {
    id: 13,
    shortTitle: "International",
    thesis:
      "Ich möchte in der Gruppe internationale Studierende kennenlernen.",
    mappings: [{ attribute: "international" }],
  },
  {
    id: 14,
    shortTitle: "Englisch",
    thesis:
      "Eine Gruppe, die auch auf Englisch kommuniziert oder internationale Themen bearbeitet, interessiert mich.",
    mappings: [{ attribute: "international" }, { attribute: "language" }],
  },
  {
    id: 15,
    shortTitle: "Wettbewerb",
    thesis:
      "Ich schätze Wettbewerbe und Turniere – ob Sport, Hackathon oder Debatte.",
    mappings: [{ attribute: "competitive" }, { attribute: "sports" }],
  },
  {
    id: 16,
    shortTitle: "Kompetitiv",
    thesis:
      "Ein kompetitives Umfeld spornt mich an und bringt meine Leistung auf ein höheres Niveau.",
    mappings: [{ attribute: "competitive" }],
  },
  {
    id: 17,
    shortTitle: "Tech & Coding",
    thesis:
      "Ich möchte Coding, IT-Technologien oder digitale Systeme in der Gruppe einsetzen.",
    mappings: [{ attribute: "tech" }],
  },
  {
    id: 18,
    shortTitle: "Outdoor & Analog",
    thesis:
      "Analoge Aktivitäten – z.\u00A0B. Basteln, Kochen, Outdoor-Aktionen – ziehe ich digitalen vor.",
    mappings: [{ attribute: "outdoor" }],
  },
  {
    id: 19,
    shortTitle: "Einstieg",
    thesis:
      "Ich möchte, dass keine Vorkenntnisse für die Teilnahme notwendig sind.",
    mappings: [{ attribute: "beginner_friendly" }],
  },
  {
    id: 20,
    shortTitle: "Entrepreneurship",
    thesis:
      "Ich möchte unternehmerische Ideen entwickeln oder ein eigenes Projekt / Startup vorantreiben.",
    mappings: [{ attribute: "career" }, { attribute: "networking" }],
  },
];
