// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { CATEGORIES, CATEGORY_SEO, categoryLabel } from "@/lib/categories";
import { GERMAN_ONLY_NOTE, groupLongText, groupShortText, isGermanOnly } from "@/lib/group-copy";
import { groupTranslations } from "@/lib/group-translations";
import { makeGroup } from "./helpers";

const ROOT = path.resolve(__dirname, "../../..");
const translationsFile = path.join(ROOT, "data/group-translations.json");

function validateWith(translations: unknown): string {
  const dir = mkdtempSync(path.join(tmpdir(), "fomo-tr-"));
  try {
    const file = path.join(dir, "group-translations.json");
    writeFileSync(file, JSON.stringify({ translations }));
    return execFileSync(process.execPath, ["scripts/validate-data.mjs", "--translations", file], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("translation check in validate-data.mjs", () => {
  const real = JSON.parse(readFileSync(translationsFile, "utf8")).translations;

  it("is quiet for the committed translations", () => {
    const out = validateWith(real);
    expect(out).not.toContain("Übersetzung veraltet");
    expect(out).not.toContain("unbekannte Gruppe");
  });

  it("warns about outdated and orphaned translations", () => {
    const [slug] = Object.keys(real);
    const out = validateWith({
      ...real,
      [slug]: { ...real[slug], sourceHash: "0000000000000000" },
      "gibt-es-nicht": { sourceHash: "x", text: "Orphan" },
    });
    expect(out).toContain(`${slug}: englische Übersetzung veraltet`);
    expect(out).toContain('Übersetzung für unbekannte Gruppe "gibt-es-nicht"');
    expect(out).toContain("✓ Datenprüfung bestanden."); // warnings only
  });
});

describe("categories", () => {
  it("has one entry per category with an English label, SEO pages for all but Sonstiges", () => {
    expect(CATEGORIES).toHaveLength(11);
    for (const c of CATEGORIES) expect(c.en.length).toBeGreaterThan(0);
    expect(CATEGORY_SEO.map((c) => c.categoryName)).toEqual(
      CATEGORIES.filter((c) => c.name !== "Sonstiges").map((c) => c.name),
    );
    expect(CATEGORY_SEO.map((c) => c.slug)).toContain("musik");
    expect(CATEGORY_SEO.map((c) => c.slug)).toContain("glaube-spiritualitaet");
    expect(categoryLabel("Glaube & Spiritualität", "en")).toBe("Faith & spirituality");
    expect(categoryLabel("Unbekannt", "en")).toBe("Unbekannt");
  });
});

describe("English fallback", () => {
  it("shows the German text with a note instead of a word-by-word translation", () => {
    const g = {
      ...makeGroup("ohne-uebersetzung", {}),
      shortDescription: "Die Hochschulgruppe trifft sich wöchentlich.",
      longDescription: "Die Hochschulgruppe trifft sich wöchentlich an der TU Dresden.",
    };
    expect(groupTranslations[g.slug]).toBeUndefined();
    expect(isGermanOnly(g, "en")).toBe(true);
    expect(isGermanOnly(g, "de")).toBe(false);
    expect(groupShortText(g, "en")).toBe("Die Hochschulgruppe trifft sich wöchentlich.");
    expect(groupLongText(g, "en")).toBe("Die Hochschulgruppe trifft sich wöchentlich an der TU Dresden.");
    expect(GERMAN_ONLY_NOTE).toMatch(/German/);
  });

  it("uses the hand-written translation when there is one", () => {
    const [slug, text] = Object.entries(groupTranslations)[0];
    const g = { ...makeGroup(slug, {}), shortDescription: "Deutsch", longDescription: "Deutsch lang" };
    expect(isGermanOnly(g, "en")).toBe(false);
    expect(groupLongText(g, "en")).toBe(text);
  });
});
