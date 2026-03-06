// SPDX-License-Identifier: AGPL-3.0-only
// Maps CSV group attributes to pilot questionnaire dimensions (D1–D10)

export const ATTRIBUTE_TO_DIMENSION: Record<string, string> = {
  career: "D1", // Zeitbudget (career = hoher Einsatz)
  tech: "D9", // Digital vs. Analog
  socialImpact: "D4", // Politisches Engagement
  party: "D3", // Sozialstil
  religion: "D6", // Nachhaltigkeit & Werte
  sports: "D8", // Kompetitivität
  networking: "D3", // Sozialstil
  arts: "D5", // Kreativität
  music: "D5", // Kreativität
  timeLow: "D1", // Zeitbudget
  handsOn: "D2", // Hands-on vs. Theoretisch
  outdoor: "D9", // Digital vs. Analog
  international: "D7", // Internationalität
  beginnerFriendly: "D10", // Einstieg
  competitive: "D8", // Kompetitivität
  financialCost: "D1", // Zeitbudget (indirekt)
  leadershipOpportunities: "D1", // Zeitbudget (Verbindlichkeit)
};

export const DIMENSION_LABELS: Record<string, string> = {
  D1: "Zeitbudget & Verbindlichkeit",
  D2: "Hands-on vs. Theoretisch",
  D3: "Sozialstil",
  D4: "Politisches Engagement",
  D5: "Kreativität",
  D6: "Werte & Weltanschauung",
  D7: "Internationalität",
  D8: "Kompetitivität",
  D9: "Digital vs. Analog",
  D10: "Einstiegsfreundlichkeit",
};
