// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import {
  RESULT_SCHEMA,
  buildGroupMessage,
  buildSystemPrompt,
  renderReport,
  sortResults,
  verifiedGroups,
} from "../../../scripts/plausibility-lib.mjs";
import groupsData from "../../../data/groups.json";
import quiz from "../../../data/quiz.json";
import categories from "../../../data/categories.json";

const all = (groupsData as { groups: unknown[] }).groups as Parameters<typeof verifiedGroups>[0];

describe("plausibility check", () => {
  it("only checks verified groups", () => {
    const checked = verifiedGroups(all);
    expect(checked.length).toBeGreaterThan(0);
    expect(checked.every((g: { selfRating: { derived: boolean } }) => g.selfRating.derived === false)).toBe(true);
    expect(checked.length).toBeLessThan(all.length);
  });

  it("puts every statement, filter and category into the system prompt", () => {
    const prompt = buildSystemPrompt(quiz, categories);
    for (const item of quiz.items) expect(prompt).toContain(`${item.id}: ${item.text}`);
    for (const o of quiz.filters.options) expect(prompt).toContain(o.attribute);
    for (const c of categories.categories) expect(prompt).toContain(c.name);
  });

  it("sends name, category, descriptions and all 21 answers — no contact data", () => {
    const g = verifiedGroups(all)[0];
    const msg = buildGroupMessage(g, quiz);
    expect(msg).toContain(g.name);
    expect(msg).toContain(g.categoryName);
    for (const item of quiz.items) expect(msg).toContain(`${item.id}:`);
    expect(msg).not.toContain("@");
    if (g.websiteUrl) expect(msg).not.toContain(g.websiteUrl);
  });

  it("has a strict result schema", () => {
    expect(RESULT_SCHEMA.additionalProperties).toBe(false);
    expect(RESULT_SCHEMA.properties.findings.items.additionalProperties).toBe(false);
  });

  it("lists contradictions first and escapes HTML in the report", () => {
    const results = [
      { id: "1", slug: "a", name: "A", verdict: "ok", summary: "", findings: [] },
      {
        id: "2",
        slug: "b",
        name: "B <script>",
        verdict: "widerspruch",
        summary: "x",
        findings: [{ field: "kategorie", ref: "Sport", current: "Sport", suggestion: "Technik", evidence: "<b>Gaming</b>", confidence: "hoch" }],
      },
    ];
    expect(sortResults(results).map((r: { slug: string }) => r.slug)).toEqual(["b", "a"]);
    const html = renderReport(results, { model: "m", createdAt: "t", siteUrl: "https://s", adminUrl: "https://a" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;b&gt;Gaming&lt;/b&gt;");
    expect(html).toContain("https://a/admin/groups/2");
    expect(html.indexOf("B &lt;script&gt;")).toBeLessThan(html.indexOf(">A <"));
  });
});
