// SPDX-License-Identifier: AGPL-3.0-only

import type { LiveGroup } from "./types";

/** ~15 hand-curated test groups from hg_MERGED.csv for initial development */
export const LIVE_GROUPS: LiveGroup[] = [
  {
    id: "404-esports",
    name: "404 University Esports Dresden",
    description:
      "E-Sport-Hochschulgruppe der TU Dresden mit Fokus auf kompetitives Gaming, Community-Events und E-Sport-Kursen für Studierende.",
    attributes: {
      career: 1, tech: 1, language: 1, social_impact: 0, party: 1,
      religion: 0, sports: 1, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 0, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 1, event_frequency: 1,
      leadership_opportunities: 1, group_size: 1,
    },
  },
  {
    id: "aegee",
    name: "AEGEE-Dresden e.\u00A0V.",
    description:
      "Studierendenverein im europäischen AEGEE-Netzwerk, der mit Buddy-Programm, internationalen Projekten und Veranstaltungen den interkulturellen Austausch fördert.",
    attributes: {
      career: 1, tech: 0, language: 1, social_impact: 1, party: 1,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "aiesec",
    name: "AIESEC",
    description:
      "Lokale Gruppe der weltweit größten, von Studierenden geführten Austauschorganisation mit Praktika und Freiwilligenprojekten im Ausland.",
    attributes: {
      career: 1, tech: 0, language: 1, social_impact: 1, party: 0,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 1, event_frequency: 1,
      leadership_opportunities: 1, group_size: 1,
    },
  },
  {
    id: "amnesty",
    name: "Amnesty International HSG Dresden",
    description:
      "Ehrenamtliche Studierendengruppe, die durch Aktionen, Workshops und Kampagnen auf Menschenrechtsverletzungen aufmerksam macht.",
    attributes: {
      career: 0, tech: 0, language: 1, social_impact: 1, party: 0,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 1, hands_on: 1, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "betonboot",
    name: "Betonbootteam TU Dresden",
    description:
      "Bauingenieur-Studierende, die kreative Betonboote planen, bauen und bei nationalen Regatten sowohl konstruktiv als auch sportlich einsetzen.",
    attributes: {
      career: 1, tech: 1, language: 0, social_impact: 0, party: 1,
      religion: 0, sports: 1, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 1, international: 0,
      beginner_friendly: 1, competitive: 1, event_frequency: 0,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "campusradio",
    name: "Campusradio Dresden e.\u00A0V.",
    description:
      "Unabhängiges studentisches Internetradio, in dem Studierende eigenverantwortlich Beiträge und Sendungen produzieren.",
    attributes: {
      career: 1, tech: 1, language: 1, social_impact: 1, party: 1,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 1,
      time_low: 0, hands_on: 1, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "christians",
    name: "Christians for Mission",
    description:
      "Christliche Hochschulgruppe, die sich regelmäßig zur gemeinsamen Bibellese trifft und zum Austausch über den Glauben einlädt.",
    attributes: {
      career: 0, tech: 0, language: 1, social_impact: 0, party: 0,
      religion: 1, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 1, hands_on: 0, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "haengemathe",
    name: "Club HängeMathe e.\u00A0V.",
    description:
      "Studentenclub mit günstigen Getränken, Themenpartys, Konzerten und Kleinkunstabenden in gemütlicher Atmosphäre.",
    attributes: {
      career: 0, tech: 0, language: 1, social_impact: 0, party: 1,
      religion: 0, sports: 0, networking: 1, arts: 1, music: 1,
      time_low: 0, hands_on: 1, outdoor: 0, international: 0,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "die-buehne",
    name: "DIE BÜHNE – Theater der TU Dresden",
    description:
      "Studentisches Theater mit hohem künstlerischen Anspruch, zahlreichen Produktionen und Kursen für Theaterbegeisterte aller Erfahrungsstufen.",
    attributes: {
      career: 0, tech: 0, language: 1, social_impact: 0, party: 1,
      religion: 0, sports: 0, networking: 1, arts: 1, music: 0,
      time_low: 0, hands_on: 1, outdoor: 0, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 1,
    },
  },
  {
    id: "elbflorace",
    name: "Elbflorace Formula Student Team",
    description:
      "Interdisziplinäres Studierendenteam, das wettkampforientiert elektrische und autonome Formelrennwagen entwickelt und baut.",
    attributes: {
      career: 1, tech: 1, language: 1, social_impact: 0, party: 0,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 0, international: 1,
      beginner_friendly: 0, competitive: 1, event_frequency: 1,
      leadership_opportunities: 1, group_size: 1,
    },
  },
  {
    id: "esn",
    name: "Erasmus Student Network TU Dresden",
    description:
      "Verein, der internationale Austauschstudierende betreut und interkulturelle Begegnungen durch Veranstaltungen, Ausflüge und Partys fördert.",
    attributes: {
      career: 1, tech: 0, language: 1, social_impact: 1, party: 1,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 1, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "fff",
    name: "Fridays for Future Dresden",
    description:
      "Lokalgruppe der Klimabewegung, die regelmäßig Klimastreiks und Aktionen für Klimagerechtigkeit organisiert.",
    attributes: {
      career: 0, tech: 0, language: 1, social_impact: 1, party: 0,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 1, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 1,
    },
  },
  {
    id: "ig-boerse",
    name: "IG Börse an der TU Dresden",
    description:
      "Studentischer Börsenverein mit Vorträgen, Seminaren und Exkursionen für praxisnahe Einblicke in Finanzmärkte.",
    attributes: {
      career: 1, tech: 0, language: 0, social_impact: 0, party: 0,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 0, international: 0,
      beginner_friendly: 1, competitive: 1, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "iog",
    name: "Ingenieure ohne Grenzen Dresden",
    description:
      "Ehrenamtliche Hochschulgruppe für technische Entwicklungsprojekte und Bildungsarbeit mit sozialem und internationalem Fokus.",
    attributes: {
      career: 1, tech: 1, language: 1, social_impact: 1, party: 0,
      religion: 0, sports: 0, networking: 1, arts: 0, music: 0,
      time_low: 0, hands_on: 1, outdoor: 1, international: 1,
      beginner_friendly: 1, competitive: 0, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
  {
    id: "junges-ensemble",
    name: "Junges Ensemble Dresden",
    description:
      "Ambitionierter studentischer Kammerchor mit etwa 35 Sänger:innen, der anspruchsvolle a-cappella-Chorliteratur erarbeitet.",
    attributes: {
      career: 0, tech: 0, language: 0, social_impact: 0, party: 0,
      religion: 0, sports: 0, networking: 0, arts: 1, music: 1,
      time_low: 0, hands_on: 0, outdoor: 0, international: 1,
      beginner_friendly: 0, competitive: 1, event_frequency: 1,
      leadership_opportunities: 1, group_size: 0,
    },
  },
];
