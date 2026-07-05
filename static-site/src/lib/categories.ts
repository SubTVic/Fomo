// SPDX-License-Identifier: AGPL-3.0-only
// SEO category landing pages (/groups/kategorie/<slug>). One page per real
// category — each targets a generic search cluster like "Sport Hochschulgruppen
// Dresden". "Sonstiges" is deliberately excluded: it is the scraper's default
// bucket and targets no search intent. As categories get curated in the admin
// DB, these pages fill up automatically on the next data export.

export interface CategorySeo {
  /** URL slug under /groups/kategorie/ */
  slug: string;
  /** Must match groups.json categoryName exactly. */
  categoryName: string;
  /** H1 / title, phrased like the search query. */
  title: string;
  /** Meta description (~150 chars, keyword-bearing). */
  description: string;
  /** 2–3 sentence intro rendered on the page. */
  intro: string;
}

export const CATEGORY_SEO: CategorySeo[] = [
  {
    slug: "sport-bewegung",
    categoryName: "Sport & Bewegung",
    title: "Sport-Hochschulgruppen in Dresden",
    description:
      "Sportliche Hochschulgruppen an der TU Dresden: Teams, Training und Wettkämpfe für Studierende — vom Anfänger bis zum Wettkampf-Level.",
    intro:
      "Du willst neben dem Studium Sport machen — im Team, mit festem Training oder bei Wettkämpfen? Diese Hochschulgruppen an der TU Dresden bringen Studierende in Bewegung: von klassischen Sportarten bis zu ungewöhnlichen Disziplinen, für Einsteiger:innen genauso wie für Ambitionierte.",
  },
  {
    slug: "technik-wissenschaft",
    categoryName: "Technik & Wissenschaft",
    title: "Technik- und Wissenschafts-Hochschulgruppen in Dresden",
    description:
      "Tech-Hochschulgruppen an der TU Dresden: Robotik, Coding, Rennwagen, Forschung — hier bauen Studierende echte Projekte, keine Übungsaufgaben.",
    intro:
      "Programmieren, Löten, Konstruieren, Forschen: In den Technik-Hochschulgruppen der TU Dresden arbeiten Studierende an echten Projekten — vom Roboter über den Rennwagen bis zur Software. Vorkenntnisse sind oft keine Voraussetzung, Neugier schon.",
  },
  {
    slug: "kunst-kultur",
    categoryName: "Kunst & Kultur",
    title: "Kunst- und Kultur-Hochschulgruppen in Dresden",
    description:
      "Kreative Hochschulgruppen an der TU Dresden: Theater, Musik, Film, Fotografie und Schreiben — Kultur von Studierenden für Studierende.",
    intro:
      "Auf der Bühne stehen, musizieren, fotografieren, schreiben oder Filme drehen: Die Kunst- und Kultur-Hochschulgruppen der TU Dresden sind der Ort für kreative Studierende — ganz gleich, ob du Erfahrung mitbringst oder einfach etwas Neues ausprobieren willst.",
  },
  {
    slug: "soziales-engagement",
    categoryName: "Soziales Engagement",
    title: "Soziale und ehrenamtliche Hochschulgruppen in Dresden",
    description:
      "Ehrenamt neben dem Studium: soziale Hochschulgruppen an der TU Dresden — von Erster Hilfe über Nachhilfe bis zur Unterstützung Geflüchteter.",
    intro:
      "Du willst dich neben dem Studium ehrenamtlich engagieren und anderen Menschen direkt helfen? Diese Hochschulgruppen an der TU Dresden machen genau das — von Erster Hilfe über Bildungsprojekte bis zur Unterstützung von Menschen in schwierigen Lebenslagen.",
  },
  {
    slug: "politik-gesellschaft",
    categoryName: "Politik & Gesellschaft",
    title: "Politische Hochschulgruppen in Dresden",
    description:
      "Politik und Hochschulpolitik an der TU Dresden: Gruppen für Debatte, Mitbestimmung und gesellschaftliches Engagement im Studium.",
    intro:
      "Mitreden statt zuschauen: In den politischen und gesellschaftlichen Hochschulgruppen der TU Dresden debattieren, gestalten und engagieren sich Studierende — in der Hochschulpolitik, in politischen Jugendorganisationen und in Initiativen für gesellschaftliche Themen.",
  },
  {
    slug: "nachhaltigkeit",
    categoryName: "Nachhaltigkeit",
    title: "Nachhaltigkeits-Hochschulgruppen in Dresden",
    description:
      "Nachhaltigkeit an der TU Dresden: Hochschulgruppen für Umwelt- und Klimaschutz — praktisch, konkret und offen für alle Studierenden.",
    intro:
      "Klimaschutz, Umweltbildung, nachhaltiger Campus: Diese Hochschulgruppen der TU Dresden setzen sich praktisch für Nachhaltigkeit ein. Wer etwas bewegen will statt nur zu diskutieren, findet hier Mitstreiter:innen.",
  },
  {
    slug: "internationales",
    categoryName: "Internationales",
    title: "Internationale Hochschulgruppen in Dresden",
    description:
      "International students & interkultureller Austausch an der TU Dresden: Hochschulgruppen für Erasmus, Buddy-Programme und weltweite Kontakte.",
    intro:
      "Ob du selbst aus dem Ausland nach Dresden gekommen bist oder internationale Freundschaften suchst: Diese Hochschulgruppen der TU Dresden verbinden Studierende über Ländergrenzen hinweg — mit Buddy-Programmen, Events und interkulturellem Austausch (auch auf Englisch).",
  },
  {
    slug: "wirtschaft-karriere",
    categoryName: "Wirtschaft & Karriere",
    title: "Wirtschafts- und Karriere-Hochschulgruppen in Dresden",
    description:
      "Karriere neben dem Studium: Hochschulgruppen an der TU Dresden für Praxiserfahrung, Unternehmenskontakte, Consulting und Gründung.",
    intro:
      "Praxiserfahrung sammeln, Unternehmen kennenlernen, vielleicht sogar selbst gründen: Die Wirtschafts- und Karriere-Hochschulgruppen der TU Dresden sind das Sprungbrett für den Berufseinstieg — mit echten Projekten statt Karrieremessen-Smalltalk.",
  },
];

export function getCategorySeoBySlug(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO.find((c) => c.slug === slug);
}
