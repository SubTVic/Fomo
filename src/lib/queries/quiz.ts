// SPDX-License-Identifier: AGPL-3.0-only
// Server-side queries for the live quiz.
// Set DATA_SOURCE=json in .env to load from local JSON files (no DB needed).

import type { QuizThesisData, QuizGroupData } from "@/lib/quiz/types";

const MATCHING_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports",
  "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
  "international", "beginnerFriendly", "competitive", "financialCost",
  "leadershipOpportunities",
] as const;

const USE_JSON = process.env.DATA_SOURCE === "json";

// ─── JSON fallback ────────────────────────────────────────────

async function getThesesFromJson(): Promise<QuizThesisData[]> {
  const { default: ws } = await import("../../../data/working-set-v1.json");
  return ws.items.map((t) => ({
    id: t.id,
    text: t.text,
    shortTitle: t.shortTitle,
    hint: t.hint ?? null,
    order: t.order,
    attributes: t.attributes,
  }));
}

async function getGroupsFromJson(): Promise<QuizGroupData[]> {
  const { default: profiles } = await import("../../../data/hsg-profiles-scraped.json");
  return (profiles as ScrapedProfile[])
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.id,
      shortDescription: p.shortDescription ?? "",
      longDescription: null,
      categoryName: "Hochschulgruppe",
      websiteUrl: p.website ?? null,
      instagramUrl: null,
      contactEmail: null,
      attributes: Object.fromEntries(
        MATCHING_ATTRS.map((attr) => [attr, p.attributes[attr] === true])
      ),
      nextEventTitle: null,
      nextEventDate: null,
      nextEventTime: null,
      nextEventLocation: null,
      nextEventUrl: null,
      nextEventIsOpen: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface ScrapedProfile {
  id: string;
  name: string;
  shortDescription?: string;
  website?: string | null;
  attributes: Record<string, boolean | string | null>;
}

// ─── DB queries ───────────────────────────────────────────────

async function getThesesFromDb(): Promise<QuizThesisData[]> {
  const { db } = await import("@/lib/db");
  const theses = await db.quizThesis.findMany({
    where: { isActive: true },
    include: { attributes: { select: { attribute: true, isInverse: true } } },
    orderBy: { order: "asc" },
  });
  return theses.map((t) => ({
    id: t.id,
    text: t.text,
    shortTitle: t.shortTitle,
    hint: t.hint,
    order: t.order,
    attributes: t.attributes,
  }));
}

async function getGroupsFromDb(): Promise<QuizGroupData[]> {
  const { db } = await import("@/lib/db");
  const groups = await db.group.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true } },
      selfRating: { include: { answers: true } },
    },
    orderBy: { name: "asc" },
  });
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    shortDescription: g.shortDescription,
    longDescription: g.longDescription,
    categoryName: g.category.name,
    websiteUrl: g.websiteUrl,
    instagramUrl: g.instagramUrl,
    contactEmail: g.contactEmail,
    attributes: Object.fromEntries(
      MATCHING_ATTRS.map((attr) => [attr, g[attr] as boolean])
    ),
    nextEventTitle: g.nextEventTitle,
    nextEventDate: g.nextEventDate,
    nextEventTime: g.nextEventTime,
    nextEventLocation: g.nextEventLocation,
    nextEventUrl: g.nextEventUrl,
    nextEventIsOpen: g.nextEventIsOpen,
    selfRating: g.selfRating
      ? {
          raterCount: g.selfRating.raterCount,
          filterSelections: Array.isArray(g.selfRating.filterSelections)
            ? (g.selfRating.filterSelections as string[])
            : [],
          answers: g.selfRating.answers.map((a) => ({ itemId: a.itemId, value: a.value })),
        }
      : null,
  }));
}

// ─── Public API ───────────────────────────────────────────────

export async function getActiveQuizTheses(): Promise<QuizThesisData[]> {
  return USE_JSON ? getThesesFromJson() : getThesesFromDb();
}

export async function getQuizGroups(): Promise<QuizGroupData[]> {
  return USE_JSON ? getGroupsFromJson() : getGroupsFromDb();
}

export async function getAllQuizThesesForAdmin() {
  const { db } = await import("@/lib/db");
  return db.quizThesis.findMany({
    include: { attributes: true },
    orderBy: { order: "asc" },
  });
}
