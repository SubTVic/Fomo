// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { PARTNER_COPY, PARTNER_OFFER } from "@/lib/partner";

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

  it("mentions the same code in the card text it links to", () => {
    expect(PARTNER_COPY.de.cardText).toContain(PARTNER_OFFER.code);
    expect(PARTNER_COPY.en.cardText).toContain(PARTNER_OFFER.code);
  });
});
