// SPDX-License-Identifier: AGPL-3.0-only
// Demo personas with pre-defined quiz answers (keyed by thesis shortTitle)

import type { QuizThesisData } from "@/lib/quiz/types";

export interface Persona {
  name: string;
  study: string;
  emoji: string;
  description: string;
  color: string;
  // shortTitle -> answer value: "5" agree, "3" neutral, "1" disagree
  answersByTitle: Record<string, "5" | "3" | "1">;
}

export const PERSONAS: Persona[] = [
  {
    name: "Max",
    study: "Maschinenbau, 1. Semester",
    emoji: "⚙️",
    description:
      "Mag praktisches Bauen, interessiert sich für Technik und Karriere. Sucht Wettbewerbe und Herausforderungen. Kein Interesse an Kunst oder Religion.",
    color: "#1a6a9a",
    answersByTitle: {
      Zeitaufwand: "5",       // bereit >5h/Woche
      Karriere: "5",          // Karriere wichtig
      Technik: "5",           // tech-affin
      Gesellschaft: "1",      // kein Fokus auf soziale Probleme
      Socializing: "3",       // neutral
      Glaube: "1",            // Religion unwichtig
      Sport: "3",             // neutral
      Netzwerk: "5",          // Kontakte knüpfen wichtig
      Kunst: "1",             // kein Interesse an Kunst
      Musik: "1",             // kein Interesse an Musik
      "Praktisches Tun": "5", // hands-on
      Outdoor: "3",           // neutral
      International: "3",     // neutral
      Einstieg: "1",          // braucht kein Anfänger-freundlich
      Wettbewerb: "5",        // liebt Wettbewerbe
      Kosten: "5",            // Kosten kein Problem
      Verantwortung: "5",     // will Verantwortung übernehmen
      "Karriere & Netzwerk": "5",   // beides wichtig
      "Bauen & Wettbewerb": "5",    // bauen + antreten
      "Kunst & Musik": "1",         // nicht kreativ/musikalisch
    },
  },
  {
    name: "Lena",
    study: "Psychologie, 1. Semester",
    emoji: "🌱",
    description:
      "Offen für neue Menschen, will gesellschaftlich etwas bewegen. Mag Kreativität und internationale Begegnungen. Kein Interesse an Wettbewerb oder Technik.",
    color: "#2a7a4a",
    answersByTitle: {
      Zeitaufwand: "3",       // moderater Zeitaufwand okay
      Karriere: "3",          // etwas wichtig
      Technik: "1",           // kein Tech-Interesse
      Gesellschaft: "5",      // gesellschaftliche Probleme wichtig
      Socializing: "5",       // Feiern und Community wichtig
      Glaube: "3",            // neutral
      Sport: "3",             // neutral
      Netzwerk: "3",          // neutral
      Kunst: "5",             // kreativ-begeistert
      Musik: "3",             // etwas Musik
      "Praktisches Tun": "3", // neutral
      Outdoor: "3",           // neutral
      International: "5",     // internationale Kontakte wichtig
      Einstieg: "5",          // bevorzugt Gruppen ohne Vorkenntnisse
      Wettbewerb: "1",        // kein Wettbewerbs-Interesse
      Kosten: "3",            // neutral zu Kosten
      Verantwortung: "3",     // neutral
      "Karriere & Netzwerk": "3",   // neutral
      "Bauen & Wettbewerb": "1",    // kein bauen/messen
      "Kunst & Musik": "5",         // Kunst und Musik wichtig
    },
  },
];

// Convert persona answers (by shortTitle) to answers Record (by thesis id)
export function resolvePersonaAnswers(
  persona: Persona,
  theses: QuizThesisData[],
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const thesis of theses) {
    const val = persona.answersByTitle[thesis.shortTitle];
    if (val) answers[thesis.id] = val;
  }
  return answers;
}

export const ANSWER_LABELS: Record<string, { label: string; color: string; symbol: string }> = {
  "5": { label: "Stimme zu", color: "#16a34a", symbol: "✓" },
  "3": { label: "Neutral", color: "#6b7280", symbol: "–" },
  "1": { label: "Stimme nicht zu", color: "#dc2626", symbol: "✗" },
};
