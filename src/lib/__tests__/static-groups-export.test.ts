// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import {
  BINARY_ATTRS,
  buildStaticGroups,
  type ExportGroupInput,
  type QuizShape,
} from "@/lib/export/static-groups";
import { hasValidExportToken } from "@/lib/export/export-token";

const ROOT = path.resolve(__dirname, "../../..");
const QUIZ_PATH = path.join(ROOT, "static-site/data/quiz.json");
const quiz = JSON.parse(readFileSync(QUIZ_PATH, "utf8")) as QuizShape;
const ITEM_IDS = quiz.items.map((i) => i.id);

const categories = [
  { id: "cat-sport", name: "Sport & Bewegung", color: "#00BBF9", icon: "trophy" },
  { id: "cat-kultur", name: "Kunst & Kultur", color: null, icon: null },
];

function group(overrides: Partial<Record<string, unknown>>) {
  return {
    id: "g",
    name: "Gruppe",
    slug: "gruppe",
    shortDescription: "Kurz",
    longDescription: null,
    categoryId: "cat-sport",
    isActive: true,
    isVerified: false,
    websiteUrl: null,
    instagramUrl: null,
    contactEmail: null,
    memberCount: null,
    language: null,
    eventFrequency: null,
    groupSize: null,
    motto: null,
    foundedYear: null,
    logoUrl: null,
    nextEventTitle: null,
    nextEventDate: null,
    nextEventTime: null,
    nextEventLocation: null,
    nextEventUrl: null,
    nextEventIsOpen: false,
    ...Object.fromEntries(BINARY_ATTRS.map((a) => [a, false])),
    ...overrides,
  };
}

// Backup-shaped fixture (what /api/admin/backup returns), covering: verified
// with rating, verified without rating, unverified with attributes, inactive,
// umlaut sorting, a next event, and a missing category.
const backup = {
  categories,
  groups: [
    group({
      id: "g1", name: "Ökologie AG", slug: "oekologie-ag", isVerified: true,
      websiteUrl: "https:/oeko.example.org", instagramUrl: "@oeko.ag", outdoor: true, language: "german",
    }),
    group({
      id: "g2", name: "Akaflieg", slug: "akaflieg", isVerified: false, categoryId: "cat-kultur",
      tech: true, handsOn: true, groupSize: "small", eventFrequency: "high",
      nextEventTitle: "Schnupperflug", nextEventDate: "2026-10-10", nextEventIsOpen: true,
    }),
    group({ id: "g3", name: "Zeta", slug: "zeta", isVerified: true, websiteUrl: "kein link" }),
    group({ id: "g4", name: "Inaktiv", slug: "inaktiv", isActive: false, isVerified: true }),
    group({ id: "g5", name: "Ohne Kategorie", slug: "ohne-kategorie", categoryId: "missing", music: true }),
  ],
  groupSelfRatings: [
    { id: "r1", groupId: "g1", raterCount: 2, filterSelections: ["outdoor", 7] },
    { id: "r4", groupId: "g4", raterCount: 1, filterSelections: [] },
  ],
  groupSelfRatingAnswers: [
    // Reversed, so both exporters have to sort answers into quiz order.
    ...ITEM_IDS.map((itemId, i) => ({ id: `a1-${i}`, ratingId: "r1", itemId, value: (i % 3) - 1 })).reverse(),
    ...ITEM_IDS.map((itemId, i) => ({ id: `a4-${i}`, ratingId: "r4", itemId, value: 1 })),
  ],
};

/** The same fixture in the shape Prisma returns with staticGroupsQuery. */
function asDbRows(): ExportGroupInput[] {
  return backup.groups.map((g) => {
    const cat = categories.find((c) => c.id === g.categoryId) ?? null;
    const rating = backup.groupSelfRatings.find((r) => r.groupId === g.id) ?? null;
    return {
      ...(g as unknown as ExportGroupInput),
      category: cat && { name: cat.name, color: cat.color, icon: cat.icon },
      selfRating: rating && {
        raterCount: rating.raterCount,
        filterSelections: rating.filterSelections,
        answers: backup.groupSelfRatingAnswers
          .filter((a) => a.ratingId === rating.id)
          .map(({ itemId, value }) => ({ itemId, value })),
      },
    };
  });
}

describe("buildStaticGroups", () => {
  it("produces exactly what export-from-backup.mjs produces for the same data", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "fomo-export-"));
    try {
      const input = path.join(dir, "input.json");
      const output = path.join(dir, "groups.json");
      writeFileSync(input, JSON.stringify(backup));
      execFileSync(process.execPath, [
        path.join(ROOT, "static-site/scripts/export-from-backup.mjs"),
        "--backup", input, "--quiz", QUIZ_PATH, "--out", output,
      ], { stdio: "ignore" });
      const fromScript = JSON.parse(readFileSync(output, "utf8"));
      const fromLib = buildStaticGroups(asDbRows(), quiz, { source: "test" });

      expect(fromLib.groups).toEqual(fromScript.groups);
      expect(fromLib._meta.groupCount).toBe(fromScript._meta.groupCount);
      expect(fromLib._meta.verifiedCount).toBe(fromScript._meta.verifiedCount);
      expect(fromLib._meta.derivedCount).toBe(fromScript._meta.derivedCount);
      // Sanity: inactive dropped, umlaut sorted, only g1 has a real profile.
      expect(fromLib.groups.map((g) => g.slug)).toEqual([
        "akaflieg", "ohne-kategorie", "oekologie-ag", "zeta",
      ]);
      expect(fromLib.groups.find((g) => g.slug === "oekologie-ag")?.selfRating.derived).toBe(false);
      // Both repair typed links the same way.
      expect(fromScript.groups.find((g: { slug: string }) => g.slug === "oekologie-ag")).toMatchObject({
        websiteUrl: "https://oeko.example.org",
        instagramUrl: "https://www.instagram.com/oeko.ag/",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("only emits fields of the static site's Group format", () => {
    const published = JSON.parse(readFileSync(path.join(ROOT, "static-site/data/groups.json"), "utf8"));
    const allowed = new Set(Object.keys(published.groups[0]));
    for (const g of buildStaticGroups(asDbRows(), quiz, { source: "test" }).groups) {
      for (const key of Object.keys(g)) expect(allowed).toContain(key);
    }
  });

  it("repairs typed links but keeps values it cannot repair", () => {
    const rows = asDbRows();
    rows[0] = { ...rows[0], websiteUrl: "tud.vote", instagramUrl: "@oeko.ag" };
    rows[2] = { ...rows[2], websiteUrl: "kein link" };
    const out = buildStaticGroups(rows, quiz, { source: "test" }).groups;
    const bySlug = (slug: string) => out.find((g) => g.slug === slug)!;
    expect(bySlug("oekologie-ag").websiteUrl).toBe("https://tud.vote");
    expect(bySlug("oekologie-ag").instagramUrl).toBe("https://www.instagram.com/oeko.ag/");
    expect(bySlug("zeta").websiteUrl).toBe("kein link");
  });

  it("orders real answers like the quiz, whatever order the database returns", () => {
    const rows = asDbRows();
    rows[0] = { ...rows[0], selfRating: { ...rows[0].selfRating!, answers: [...rows[0].selfRating!.answers].reverse() } };
    const g = buildStaticGroups(rows, quiz, { source: "test" }).groups.find((x) => x.slug === "oekologie-ag")!;
    expect(g.selfRating.answers.map((a) => a.itemId)).toEqual(ITEM_IDS);
  });
});

describe("hasValidExportToken", () => {
  const token = "x".repeat(40);
  it("accepts the right bearer token only", () => {
    expect(hasValidExportToken(`Bearer ${token}`, token)).toBe(true);
    expect(hasValidExportToken(`Bearer ${token}y`, token)).toBe(false);
    expect(hasValidExportToken(token, token)).toBe(false);
    expect(hasValidExportToken(null, token)).toBe(false);
  });
  it("is disabled without a sufficiently long configured token", () => {
    expect(hasValidExportToken("Bearer ", "")).toBe(false);
    expect(hasValidExportToken("Bearer short", "short")).toBe(false);
    expect(hasValidExportToken(`Bearer ${token}`, undefined)).toBe(false);
  });
});
