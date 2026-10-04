// SPDX-License-Identifier: AGPL-3.0-only
// Build static-site/data/groups.json from the database (Umsetzungsplan WP-4.5).
//
// Same rules and format as static-site/scripts/export-from-backup.mjs (the
// emergency path from a backup file): every active group; verified groups with
// a real self-rating keep it (derived: false), all others get a naive profile
// derived from the legacy binary attributes (derived: true, browse-only).
// Output contains only the fields of the static site's `Group` type — no
// internal contact persons, tokens or admin data.

import { isHttpUrl, normalizeInstagramUrl, normalizeWebsiteUrl } from "@/lib/normalize-url";

export const BINARY_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports", "networking",
  "arts", "music", "timeLow", "handsOn", "outdoor", "international",
  "beginnerFriendly", "competitive", "financialCost", "leadershipOpportunities",
] as const;

type BinaryAttr = (typeof BINARY_ATTRS)[number];

const VALUE_MAP_FIELD: Record<string, "groupSize" | "eventFrequency" | "language"> = {
  groupSize: "groupSize",
  eventFrequency: "eventFrequency",
  language: "language",
};

export interface QuizShape {
  items: Array<{
    id: string;
    attributes: Array<{ attribute: string; isInverse?: boolean; valueMap?: Record<string, number> }>;
  }>;
  filters: { options: Array<{ attribute: string }> };
}

export type ExportGroupInput = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  isActive: boolean;
  isVerified: boolean;
  websiteUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  memberCount: number | null;
  language: string | null;
  eventFrequency: string | null;
  groupSize: string | null;
  motto: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  nextEventTitle: string | null;
  nextEventDate: string | null;
  nextEventTime: string | null;
  nextEventLocation: string | null;
  nextEventUrl: string | null;
  nextEventIsOpen: boolean | null;
  category: { name: string; color: string | null; icon: string | null } | null;
  selfRating: {
    raterCount: number | null;
    filterSelections: unknown;
    answers: Array<{ itemId: string; value: number }>;
  } | null;
} & Record<BinaryAttr, boolean | null>;

interface Shape {
  attributes: Record<string, boolean>;
  groupSize: string | null;
  eventFrequency: string | null;
  language: string | null;
}

/** Hand-coded mapping: derive an item's -1|0|1 from quiz.json item.attributes. */
function naiveItemValue(shape: Shape, item: QuizShape["items"][number]): -1 | 0 | 1 {
  let sum = 0;
  for (const m of item.attributes) {
    let raw = 0;
    if (m.valueMap) {
      const field = VALUE_MAP_FIELD[m.attribute];
      const fieldVal = field ? shape[field] : undefined;
      raw = fieldVal != null && m.valueMap[fieldVal] != null ? m.valueMap[fieldVal] : 0;
    } else {
      const v = shape.attributes[m.attribute];
      raw = v === true ? 1 : v === false ? -1 : 0;
    }
    sum += m.isInverse ? -raw : raw;
  }
  return sum > 0 ? 1 : sum < 0 ? -1 : 0;
}

/** Repair "verein.de" / "@handle" style links; keep the raw value if that fails. */
function cleanUrl(raw: string | null, normalize: (v: unknown) => unknown): string | null {
  if (raw == null || raw.trim() === "") return raw === null ? null : raw;
  const normalized = normalize(raw);
  return typeof normalized === "string" && isHttpUrl(normalized) ? normalized : raw;
}

export function buildStaticGroups(
  input: ExportGroupInput[],
  quiz: QuizShape,
  meta: { source: string; generatedAt?: string },
) {
  const itemOrder = new Map(quiz.items.map((item, i) => [item.id, i]));
  let verifiedCount = 0;
  let derivedCount = 0;

  const groups = input
    .filter((g) => g.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map((g) => {
      const attributes = Object.fromEntries(BINARY_ATTRS.map((a) => [a, g[a] === true])) as Record<
        BinaryAttr,
        boolean
      >;
      const shape: Shape = {
        attributes,
        groupSize: g.groupSize,
        eventFrequency: g.eventFrequency,
        language: g.language,
      };

      const rating = g.selfRating;
      const hasRealRating = g.isVerified && rating != null && rating.answers.length > 0;

      let selfRating;
      if (hasRealRating) {
        verifiedCount++;
        selfRating = {
          raterCount: rating.raterCount ?? 0,
          derived: false,
          filterSelections: Array.isArray(rating.filterSelections)
            ? rating.filterSelections.filter((x): x is string => typeof x === "string")
            : [],
          // Quiz order, so repeated exports produce identical files.
          answers: [...rating.answers]
            .sort((a, b) => (itemOrder.get(a.itemId) ?? 999) - (itemOrder.get(b.itemId) ?? 999))
            .map((a) => ({ itemId: a.itemId, value: a.value })),
        };
      } else {
        derivedCount++;
        selfRating = {
          raterCount: 0,
          derived: true,
          filterSelections: quiz.filters.options
            .filter((o) => attributes[o.attribute as BinaryAttr] === true)
            .map((o) => o.attribute),
          answers: quiz.items.map((item) => ({ itemId: item.id, value: naiveItemValue(shape, item) })),
        };
      }

      const nextEvent =
        g.nextEventTitle && g.nextEventDate
          ? {
              title: g.nextEventTitle,
              date: g.nextEventDate,
              time: g.nextEventTime ?? null,
              location: g.nextEventLocation ?? null,
              url: g.nextEventUrl ?? null,
              isOpen: g.nextEventIsOpen ?? false,
            }
          : null;

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        shortDescription: g.shortDescription,
        longDescription: g.longDescription,
        categoryName: g.category?.name ?? "Sonstiges",
        categoryColor: g.category?.color ?? "",
        categoryIcon: g.category?.icon ?? "",
        websiteUrl: cleanUrl(g.websiteUrl ?? null, normalizeWebsiteUrl),
        instagramUrl: cleanUrl(g.instagramUrl ?? null, normalizeInstagramUrl),
        contactEmail: g.contactEmail ?? null,
        memberCount: g.memberCount ?? null,
        language: g.language ?? null,
        eventFrequency: g.eventFrequency ?? null,
        groupSize: g.groupSize ?? null,
        motto: g.motto ?? null,
        foundedYear: g.foundedYear ?? null,
        logoUrl: g.logoUrl ?? null,
        attributes,
        nextEvent,
        selfRating,
      };
    });

  return {
    _meta: {
      source: meta.source,
      generatedAt: meta.generatedAt ?? new Date().toISOString(),
      groupCount: groups.length,
      verifiedCount,
      derivedCount,
      note: "All active groups. Verified have real selfRatings; unverified use naive-derived ratings flagged derived:true (excluded from quiz matching).",
    },
    groups,
  };
}

/** Prisma query arguments that load everything buildStaticGroups needs. */
export const staticGroupsQuery = {
  include: {
    category: { select: { name: true, color: true, icon: true } },
    selfRating: {
      select: {
        raterCount: true,
        filterSelections: true,
        answers: { select: { itemId: true, value: true } },
      },
    },
  },
} as const;
