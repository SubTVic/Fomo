// SPDX-License-Identifier: AGPL-3.0-only
// The one list of group categories (data/categories.json): German name (must
// match groups.json categoryName), English label, fallback colour and the SEO
// landing page /groups/kategorie/<slug>. "Sonstiges" has no landing page: it
// is the scraper's default bucket and targets no search intent.
// validate-data.mjs checks every group's categoryName against the same file.

import categoriesJson from "../../data/categories.json";

export interface Category {
  /** German name — must match groups.json categoryName exactly. */
  name: string;
  /** English label for /en. */
  en: string;
  /** Fallback badge colour when the exported data carries none. */
  color: string;
  /** URL slug of the SEO page, or null for no page. */
  slug: string | null;
  seo: {
    /** H1 / title, phrased like the search query. */
    title: string;
    /** Meta description (~150 chars, keyword-bearing). */
    description: string;
    /** 2–3 sentence intro rendered on the page. */
    intro: string;
  } | null;
}

export const CATEGORIES: Category[] = categoriesJson.categories;

const byName = new Map(CATEGORIES.map((c) => [c.name, c]));

/** The fallback colour of a known category, or undefined for unknown names. */
export function categoryFallbackColor(name: string): string | undefined {
  return byName.get(name)?.color;
}

/** Category label in the given language (unknown names are shown as they are). */
export function categoryLabel(name: string, lang: "de" | "en"): string {
  return lang === "en" ? (byName.get(name)?.en ?? name) : name;
}

export interface CategorySeo {
  slug: string;
  categoryName: string;
  title: string;
  description: string;
  intro: string;
}

export const CATEGORY_SEO: CategorySeo[] = CATEGORIES.flatMap((c) =>
  c.slug && c.seo ? [{ slug: c.slug, categoryName: c.name, ...c.seo }] : [],
);

export function getCategorySeoBySlug(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO.find((c) => c.slug === slug);
}
