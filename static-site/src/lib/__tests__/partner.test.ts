// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { CHALLENGE_COPY, PARTNER_COPY, PARTNER_OFFER, TASK_COPY } from "@/lib/partner";
import { COLLECTIONS, DISTRACTIONS, GROUP_MESSAGES } from "@/lib/fokus-notifications";

describe("partner offer", () => {
  it("links to an https URL that carries the advertised code", () => {
    const url = new URL(PARTNER_OFFER.url);
    expect(url.protocol).toBe("https:");
    expect(url.pathname).toContain(PARTNER_OFFER.code);
  });

  it("is labelled as an ad in both languages", () => {
    expect(PARTNER_COPY.de.label).toBe("Anzeige");
    expect(PARTNER_COPY.en.label).toBe("Ad");
  });
});

describe("partner ad works in English too", () => {
  const keys = (o: object) => Object.keys(o).sort();

  it("has the same copy keys in both languages", () => {
    expect(keys(PARTNER_COPY.en)).toEqual(keys(PARTNER_COPY.de));
    expect(keys(CHALLENGE_COPY.en)).toEqual(keys(CHALLENGE_COPY.de));
    expect(keys(TASK_COPY.en)).toEqual(keys(TASK_COPY.de));
  });

  it("has an English text for every game message, without German leftovers", () => {
    // umlauts only inside proper names that stay German in English too
    const PROPER_NAMES = /Zeltschlösschen/g;
    const german = (x: string) => /[äöüÄÖÜß]/.test(x.replace(PROPER_NAMES, ""));
    for (const m of DISTRACTIONS) {
      expect(m.text.en.trim(), m.text.de).not.toBe("");
      expect(m.from.en.trim(), m.text.de).not.toBe("");
      expect(german(m.text.en) || german(m.from.en), m.text.en).toBe(false);
    }
    for (const g of GROUP_MESSAGES) expect(german(g.en), g.en).toBe(false);
    for (const v of Object.values(CHALLENGE_COPY.en)) expect(german(String(v)), String(v)).toBe(false);
    for (const v of Object.values(TASK_COPY.en)) expect(german(String(v)), String(v)).toBe(false);
    for (const col of COLLECTIONS) expect(german(col.name.en), col.name.en).toBe(false);
  });
});
