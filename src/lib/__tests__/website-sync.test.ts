// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { BINARY_ATTRS, buildStaticGroups, type ExportGroupInput, type QuizShape } from "@/lib/export/static-groups";
import { compareWithWebsite, type WebsiteGroup } from "@/lib/website-sync";

const ROOT = path.resolve(__dirname, "../../..");
const quiz = JSON.parse(readFileSync(path.join(ROOT, "static-site/data/quiz.json"), "utf8")) as QuizShape;
const answers = quiz.items.map((i) => ({ itemId: i.id, value: 0 }));

function dbGroup(overrides: Partial<ExportGroupInput> = {}): ExportGroupInput {
  return {
    id: "g1", name: "Gruppe", slug: "gruppe", shortDescription: "Kurz", longDescription: null,
    isActive: true, isVerified: true, websiteUrl: null, instagramUrl: null, contactEmail: null,
    memberCount: null, language: null, eventFrequency: null, groupSize: null, motto: null,
    foundedYear: null, logoUrl: null, nextEventTitle: null, nextEventDate: null, nextEventTime: null,
    nextEventLocation: null, nextEventUrl: null, nextEventIsOpen: false,
    category: { name: "Sonstiges", color: null, icon: null },
    selfRating: { raterCount: 1, filterSelections: ["music"], answers },
    ...(Object.fromEntries(BINARY_ATTRS.map((a) => [a, false])) as Record<(typeof BINARY_ATTRS)[number], boolean>),
    ...overrides,
  } as ExportGroupInput;
}

/** The website copy = what the DB exports right now (then edited per test). */
function websiteOf(g: ExportGroupInput): WebsiteGroup {
  return buildStaticGroups([g], quiz, { source: "t" }).groups[0] as unknown as WebsiteGroup;
}

const cats = new Map([["Sonstiges", "c-sonst"], ["Musik", "c-musik"]]);

describe("compareWithWebsite", () => {
  it("finds nothing when the website equals the export", () => {
    const g = dbGroup({ selfRating: { raterCount: 1, filterSelections: ["culture"], answers } });
    expect(compareWithWebsite([g], [websiteOf(g)], quiz, cats).groups).toEqual([]);
  });

  it("offers website corrections with values ready for the DB", () => {
    const g = dbGroup({ selfRating: { raterCount: 1, filterSelections: ["culture"], answers } });
    const w = websiteOf(g);
    w.categoryName = "Musik";
    w.longDescription = "Korrigiert";
    w.selfRating.answers = w.selfRating.answers.map((a) => (a.itemId === "WS2-03" ? { ...a, value: 1 } : a));
    const diff = compareWithWebsite([g], [w], quiz, cats).groups[0].diffs;
    expect(diff.find((d) => d.key === "categoryId")?.apply).toBe("c-musik");
    expect(diff.find((d) => d.key === "longDescription")?.apply).toBe("Korrigiert");
    expect(diff.find((d) => d.key === "selfRating.answers.WS2-03")?.apply).toBe(1);
  });

  it("offers to write the website's areas over old activity filters in the DB", () => {
    const g = dbGroup(); // DB still holds ["music"]
    const diff = compareWithWebsite([g], [websiteOf(g)], quiz, cats).groups[0].diffs;
    expect(diff).toEqual([
      expect.objectContaining({ key: "selfRating.filterSelections", inDb: ["music"], apply: ["culture"] }),
    ]);
  });

  it("never touches verification and lists one-sided groups", () => {
    const g = dbGroup({ isVerified: false, selfRating: null });
    const w = { ...websiteOf(dbGroup({ id: "gone", name: "Weg" })) };
    const res = compareWithWebsite([g], [w], quiz, cats);
    expect(res.onlyOnWebsite.map((x) => x.id)).toEqual(["gone"]);
    expect(res.onlyInDb.map((x) => x.id)).toEqual(["g1"]);
    for (const gd of res.groups) for (const d of gd.diffs) expect(d.key).not.toMatch(/isVerified|isActive/);
  });
});
