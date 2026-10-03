// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { diffGroups, formatMarkdown, removesTooMany } from "../../../scripts/diff-groups.mjs";

type G = Record<string, unknown> & { id: string; name: string; slug: string };

function g(id: string, overrides: Record<string, unknown> = {}): G {
  return {
    id,
    name: `Gruppe ${id}`,
    slug: `gruppe-${id}`,
    shortDescription: "Kurz",
    websiteUrl: null,
    selfRating: { derived: false, raterCount: 1, filterSelections: [], answers: [{ itemId: "WS2-01", value: 1 }] },
    ...overrides,
  };
}

describe("diffGroups", () => {
  it("lists added, removed and changed groups with readable field names", () => {
    const before = { groups: [g("a"), g("b"), g("c")] };
    const after = {
      groups: [
        g("a", { websiteUrl: "https://a.example.org" }),
        g("b", { selfRating: { derived: true, raterCount: 0, filterSelections: [], answers: [] } }),
        g("d"),
      ],
    };
    const diff = diffGroups(before, after);
    expect(diff.added.map((x: G) => x.id)).toEqual(["d"]);
    expect(diff.removed.map((x: G) => x.id)).toEqual(["c"]);
    expect(diff.changed).toEqual([
      { name: "Gruppe a", slug: "gruppe-a", fields: ["websiteUrl"] },
      {
        name: "Gruppe b",
        slug: "gruppe-b",
        fields: ["selfRating.derived", "selfRating.answers", "selfRating.raterCount"],
      },
    ]);
    expect(diff.before).toEqual({ total: 3, verified: 3 });
    expect(diff.after).toEqual({ total: 3, verified: 2 });

    const md = formatMarkdown(diff);
    expect(md).toContain("**Gruppen:** 3 → 3 · **im Quiz (verifiziert):** 3 → 2");
    expect(md).toContain("➕ **neu:** Gruppe d (`gruppe-d`)");
    expect(md).toContain("✏️ Gruppe a (`gruppe-a`): Website");
    expect(md).toContain("Verifizierung (im Quiz ja/nein), Quiz-Antworten, Anzahl Ausfüllende");
  });

  it("reports no changes when only metadata differs", () => {
    const data = { _meta: { generatedAt: "x" }, groups: [g("a")] };
    const md = formatMarkdown(diffGroups(data, { ...data, _meta: { generatedAt: "y" } }));
    expect(md).toContain("Keine inhaltlichen Änderungen.");
  });

  it("flags exports that would drop too many groups", () => {
    const before = { groups: ["a", "b", "c", "d", "e"].map((id) => g(id)) };
    expect(removesTooMany(diffGroups(before, { groups: [g("a"), g("b"), g("c"), g("d")] }), 0.2)).toBe(false);
    expect(removesTooMany(diffGroups(before, { groups: [g("a"), g("b"), g("c")] }), 0.2)).toBe(true);
    expect(removesTooMany(diffGroups({ groups: [] }, { groups: [] }), 0.2)).toBe(false);
  });
});
