// SPDX-License-Identifier: AGPL-3.0-only
// Server-side loader for the "Abgleich mit Website" page and API.
import { db } from "./db";
import { staticGroupsQuery, type QuizShape } from "./export/static-groups";
import { compareWithWebsite, fetchWebsiteGroups, type WebsiteComparison } from "./website-sync";
import quiz from "../../static-site/data/quiz.json";

export async function loadWebsiteComparison(): Promise<WebsiteComparison> {
  const [website, dbGroups, categories] = await Promise.all([
    fetchWebsiteGroups(),
    db.group.findMany(staticGroupsQuery),
    db.category.findMany({ select: { id: true, name: true } }),
  ]);
  return compareWithWebsite(
    dbGroups,
    website,
    quiz as QuizShape,
    new Map(categories.map((c) => [c.name, c.id])),
  );
}
