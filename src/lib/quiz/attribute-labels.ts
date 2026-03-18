// SPDX-License-Identifier: AGPL-3.0-only
// German display labels for group matching attributes

export const ATTRIBUTE_LABELS: Record<string, string> = {
  career: "Karriere & Beruf",
  tech: "Technik & Digital",
  socialImpact: "Gesellschaftliches Engagement",
  party: "Feiern & Socializing",
  religion: "Glaube & Weltanschauung",
  sports: "Sport & Bewegung",
  networking: "Netzwerken",
  arts: "Kunst & Kreativität",
  music: "Musik",
  timeLow: "Geringer Zeitaufwand",
  handsOn: "Hands-on & Praktisch",
  outdoor: "Outdoor & Analog",
  international: "International",
  beginnerFriendly: "Einsteigerfreundlich",
  competitive: "Wettbewerb",
  financialCost: "Kosten",
  leadershipOpportunities: "Verantwortung übernehmen",
};

export const ALL_ATTRIBUTE_KEYS = Object.keys(ATTRIBUTE_LABELS);

export function getAttributeLabel(key: string): string {
  return ATTRIBUTE_LABELS[key] ?? key;
}
