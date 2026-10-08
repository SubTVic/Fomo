// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { editLinkRequestMailto } from "../edit-link-request";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

describe("edit link request mail", () => {
  it("fills group name and profile URL into subject and body", () => {
    const href = editLinkRequestMailto(
      de.landing.edit.request.mail,
      { name: "Schach & Go e.V.", slug: "schach-go" },
      "https://www.fomo-dresden.app/",
    );
    expect(href.startsWith("mailto:fomo@yeti-dresden.org?subject=")).toBe(true);
    const params = new URLSearchParams(href.slice(href.indexOf("?") + 1));
    expect(params.get("subject")).toContain("Schach & Go e.V.");
    expect(params.get("body")).toContain("https://www.fomo-dresden.app/groups/schach-go/");
    expect(params.get("body")).not.toMatch(/\{group\}|\{url\}/);
  });

  it("has the same placeholders in both languages", () => {
    for (const key of ["subject", "body"] as const) {
      const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(placeholders(en.landing.edit.request.mail[key])).toEqual(
        placeholders(de.landing.edit.request.mail[key]),
      );
    }
  });
});
