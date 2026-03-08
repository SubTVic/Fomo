// SPDX-License-Identifier: AGPL-3.0-only
// Priming context and reminders for each dimension.
// These are shown in dimension headers to keep participants focused on
// the "Hochschulgruppen" frame of reference throughout the survey.

export interface DimensionPriming {
  context: string; // One-sentence framing for this dimension
  reminder: string; // Shorter nudge shown below context
}

export const DIMENSION_PRIMING: Record<string, DimensionPriming> = {
  D1: {
    context: "Wie viel Zeit neben dem Studium w\u00fcrdest du in eine Hochschulgruppe investieren wollen?",
    reminder: "Denk an ein typisches Semester \u2013 nicht an die Pr\u00fcfungsphase.",
  },
  D2: {
    context: "Manche Gruppen bauen Roboter, andere diskutieren Politik. Was liegt dir mehr?",
    reminder: "Denk daran: Es geht um Aktivit\u00e4ten in einer Hochschulgruppe.",
  },
  D3: {
    context: "Wie m\u00f6chtest du in einer Hochschulgruppe mit anderen zusammenarbeiten?",
    reminder: "Stell dir die Treffen und den Alltag in der Gruppe vor.",
  },
  D4: {
    context: "Wie wichtig ist dir, dass deine Hochschulgruppe gesellschaftlich etwas bewegt?",
    reminder: "Von Hochschulpolitik bis Klimaaktivismus \u2013 alles z\u00e4hlt.",
  },
  D5: {
    context: "Welche Rolle spielt kreativer Ausdruck in deiner idealen Hochschulgruppe?",
    reminder: "Ob Musik, Theater, Design oder Schreiben.",
  },
  D6: {
    context: "Welche Werte sollte deine Hochschulgruppe vertreten?",
    reminder: "Nicht nur Umwelt \u2013 auch soziale Gerechtigkeit, Bildung, Gesundheit.",
  },
  D7: {
    context: "Wie international soll deine Hochschulgruppe sein?",
    reminder: "Von englischsprachigen Treffen bis zu Auslandsaustausch.",
  },
  D8: {
    context: "Motivieren dich Wettk\u00e4mpfe und ambitionierte Ziele in einer Gruppe?",
    reminder: "Von Sportligen \u00fcber Hackathons bis zu Debattierturnieren.",
  },
  D9: {
    context: "Wo f\u00fchlst du dich in einer Hochschulgruppe wohler \u2013 online oder pers\u00f6nlich?",
    reminder: "Manche Gruppen treffen sich im Labor, andere auf Discord.",
  },
  D10: {
    context: "Was erwartest du als neues Mitglied in einer Hochschulgruppe?",
    reminder: "Onboarding, Mentoring, Vorwissen \u2013 was ist dir wichtig?",
  },
};

export function getDimensionPriming(dimensionId: string): DimensionPriming | null {
  return DIMENSION_PRIMING[dimensionId] ?? null;
}
