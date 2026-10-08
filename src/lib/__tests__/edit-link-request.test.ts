// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { editLinkRequestMail, editLinkRequestMailto, editLinkRequestText } from "../edit-link-request";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

const group = { name: "Schach & Go e.V.", slug: "schach-go" };
const SITE = "https://www.fomo-dresden.app/";

describe("edit link request mail", () => {
  it("fills group name and profile URL into subject and body", () => {
    const mail = editLinkRequestMail(de.landing.edit.request.mail, group, SITE);
    expect(mail.to).toBe("fomo@yeti-dresden.org");
    expect(mail.subject).toContain("Schach & Go e.V.");
    expect(mail.body).toContain("https://www.fomo-dresden.app/groups/schach-go/");
    expect(mail.body).not.toMatch(/\{group\}|\{url\}/);
  });

  it("encodes the mailto link so special characters survive", () => {
    const mail = editLinkRequestMail(de.landing.edit.request.mail, group, SITE);
    const href = editLinkRequestMailto(mail);
    expect(href.startsWith("mailto:fomo@yeti-dresden.org?subject=")).toBe(true);
    const params = new URLSearchParams(href.slice(href.indexOf("?") + 1));
    expect(params.get("subject")).toBe(mail.subject);
    expect(params.get("body")).toBe(mail.body);
  });

  it("puts recipient and subject above the body in the copy text", () => {
    const copy = de.landing.edit.request.mail;
    const mail = editLinkRequestMail(copy, group, SITE);
    const text = editLinkRequestText(mail, copy);
    expect(text.split("\n").slice(0, 2)).toEqual([
      "An: fomo@yeti-dresden.org",
      `Betreff: ${mail.subject}`,
    ]);
    expect(text.endsWith(mail.body)).toBe(true);
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
