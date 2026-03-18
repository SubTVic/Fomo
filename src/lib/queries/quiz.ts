// SPDX-License-Identifier: AGPL-3.0-only
// Server-side queries for the live quiz

import { db } from "@/lib/db";
import type { QuizThesisData, QuizGroupData, QuizVariant } from "@/lib/quiz/types";

const MATCHING_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports",
  "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
  "international", "beginnerFriendly", "competitive", "financialCost",
  "leadershipOpportunities",
] as const;

export async function getActiveQuizTheses(): Promise<QuizThesisData[]> {
  const theses = await db.quizThesis.findMany({
    where: { isActive: true },
    include: {
      attributes: {
        select: { attribute: true, isInverse: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return theses.map((t) => ({
    id: t.id,
    text: t.text,
    shortTitle: t.shortTitle,
    order: t.order,
    attributes: t.attributes,
  }));
}

export async function getAllQuizThesesForAdmin() {
  return db.quizThesis.findMany({
    include: {
      attributes: true,
    },
    orderBy: { order: "asc" },
  });
}

export async function getQuizGroups(): Promise<QuizGroupData[]> {
  const groups = await db.group.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
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
  }));
}

export async function getQuizVariant(): Promise<QuizVariant> {
  const config = await db.siteConfig.findUnique({
    where: { key: "quiz_variant" },
  });
  const val = config?.value;
  if (val === "classic" || val === "scroll" || val === "swipe" || val === "chat") {
    return val;
  }
  return "classic";
}
