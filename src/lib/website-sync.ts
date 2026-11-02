// SPDX-License-Identifier: AGPL-3.0-only
// "Abgleich mit Website": compare what the public site shows (the
// static-site/data/groups.json on main, plus the team's area assignment) with
// what the database would export, field by field. Admins then pick which
// website values to take over into the database — never in bulk, every
// change goes through the change log and can be reverted.
//
// Deliberately NOT compared: verification, activity status, tokens, the
// legacy binary attributes and anything not on the public site. Groups that
// exist on only one side are listed, never created or deleted.

import { buildStaticGroups, type ExportGroupInput, type QuizShape } from "./export/static-groups";
import { fieldLabel, type FieldValue } from "./change-log";
import { resolveAreas } from "./areas";

/** The public site's group shape (only the fields compared here). */
export interface WebsiteGroup {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  categoryName: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  memberCount: number | null;
  language: string | null;
  eventFrequency: string | null;
  groupSize: string | null;
  motto: string | null;
  foundedYear: number | null;
  selfRating: {
    derived?: boolean;
    raterCount: number;
    filterSelections: string[];
    answers: Array<{ itemId: string; value: number }>;
  };
}

export interface FieldDiff {
  /** Change-log snapshot key (e.g. "categoryId", "selfRating.answers.WS2-03"). */
  key: string;
  label: string;
  /** Human-readable values for the table. */
  inDb: FieldValue;
  onWebsite: FieldValue;
  /** Value to write into the database (snapshot format). */
  apply: FieldValue;
}

export interface GroupDiff {
  groupId: string;
  name: string;
  slug: string;
  diffs: FieldDiff[];
}

export interface WebsiteComparison {
  groups: GroupDiff[];
  /** On the website but not exported from the DB (deleted or deactivated since). */
  onlyOnWebsite: Array<{ id: string; name: string }>;
  /** Exported from the DB but not on the website yet (new since the last sync). */
  onlyInDb: Array<{ id: string; name: string }>;
  /** Website categories with no matching DB category (cannot be applied). */
  unknownCategories: string[];
}

const SIMPLE_FIELDS = [
  "name", "slug", "shortDescription", "longDescription", "websiteUrl", "instagramUrl",
  "contactEmail", "memberCount", "language", "eventFrequency", "groupSize", "motto", "foundedYear",
] as const;

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export function compareWithWebsite(
  dbGroups: ExportGroupInput[],
  website: WebsiteGroup[],
  quiz: QuizShape,
  categoryIdByName: Map<string, string>,
): WebsiteComparison {
  const exported = buildStaticGroups(dbGroups, quiz, { source: "abgleich", generatedAt: "-" }).groups;
  const exportedById = new Map(exported.map((g) => [g.id, g]));
  const rawById = new Map(dbGroups.map((g) => [g.id, g]));
  const websiteIds = new Set(website.map((g) => g.id));
  const unknownCategories = new Set<string>();
  const groups: GroupDiff[] = [];

  for (const w of website) {
    const e = exportedById.get(w.id);
    if (!e) continue;
    const diffs: FieldDiff[] = [];

    for (const field of SIMPLE_FIELDS) {
      const wv = blankToNull(w[field]);
      const ev = blankToNull(e[field]);
      if (!same(wv, ev)) {
        diffs.push({ key: field, label: fieldLabel(field), inDb: ev as FieldValue, onWebsite: wv as FieldValue, apply: wv as FieldValue });
      }
    }

    if (w.categoryName !== e.categoryName) {
      const categoryId = categoryIdByName.get(w.categoryName);
      if (categoryId) {
        diffs.push({ key: "categoryId", label: fieldLabel("categoryId"), inDb: e.categoryName, onWebsite: w.categoryName, apply: categoryId });
      } else {
        unknownCategories.add(w.categoryName);
      }
    }

    // Self-rating: only when both sides hold a real one. Areas compare the
    // website's resolved areas (incl. data/areas.json) with the raw DB value,
    // so the team assignment can be written into the database.
    const raw = rawById.get(w.id);
    if (w.selfRating.derived !== true && e.selfRating.derived === false && raw?.selfRating) {
      const websiteAreas = resolveAreas(w.selfRating.filterSelections, w.slug);
      const dbSelections = Array.isArray(raw.selfRating.filterSelections)
        ? (raw.selfRating.filterSelections as unknown[]).filter((x): x is string => typeof x === "string").sort()
        : [];
      if (websiteAreas.length > 0 && !same([...websiteAreas].sort(), dbSelections)) {
        diffs.push({
          key: "selfRating.filterSelections",
          label: "Bereiche",
          inDb: dbSelections,
          onWebsite: websiteAreas,
          apply: [...websiteAreas].sort(),
        });
      }
      if (w.selfRating.raterCount !== e.selfRating.raterCount) {
        diffs.push({
          key: "selfRating.raterCount",
          label: fieldLabel("selfRating.raterCount"),
          inDb: e.selfRating.raterCount,
          onWebsite: w.selfRating.raterCount,
          apply: w.selfRating.raterCount,
        });
      }
      const dbAnswers = new Map(e.selfRating.answers.map((a) => [a.itemId, a.value]));
      for (const a of w.selfRating.answers) {
        if (dbAnswers.get(a.itemId) !== a.value) {
          const key = `selfRating.answers.${a.itemId}`;
          diffs.push({ key, label: fieldLabel(key), inDb: dbAnswers.get(a.itemId) ?? null, onWebsite: a.value, apply: a.value });
        }
      }
    }

    if (diffs.length > 0) groups.push({ groupId: w.id, name: w.name, slug: w.slug, diffs });
  }

  return {
    groups: groups.sort((a, b) => a.name.localeCompare(b.name, "de")),
    onlyOnWebsite: website.filter((w) => !exportedById.has(w.id)).map((w) => ({ id: w.id, name: w.name })),
    onlyInDb: exported.filter((e) => !websiteIds.has(e.id)).map((e) => ({ id: e.id, name: e.name })),
    unknownCategories: [...unknownCategories],
  };
}

/** Where the live website data is read from (the public repo's main branch). */
export const WEBSITE_GROUPS_URL =
  process.env.WEBSITE_GROUPS_URL ??
  "https://raw.githubusercontent.com/SubTVic/Fomo/main/static-site/data/groups.json";

export async function fetchWebsiteGroups(): Promise<WebsiteGroup[]> {
  const res = await fetch(WEBSITE_GROUPS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Website-Daten nicht ladbar (HTTP ${res.status})`);
  const data = (await res.json()) as { groups?: WebsiteGroup[] };
  if (!Array.isArray(data.groups)) throw new Error("Website-Daten ohne groups[]");
  return data.groups;
}
