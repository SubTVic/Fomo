// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { isHttpUrl, normalizeInstagramUrl, normalizeWebsiteUrl } from "../normalize-url";

describe("normalizeWebsiteUrl", () => {
  it.each([
    ["effektiveraltruismus.de", "https://effektiveraltruismus.de"],
    ["  www.esg-dresden.de/  ", "https://www.esg-dresden.de/"],
    ["https://verein.de/pfad?x=1", "https://verein.de/pfad?x=1"],
    ["http://verein.de", "http://verein.de"],
    ["HTTPS://Verein.de", "https://Verein.de"],
    ["https:/www.esg-dresden.de", "https://www.esg-dresden.de"],
    ["https:www.esg-dresden.de", "https://www.esg-dresden.de"],
    ["//verein.de", "https://verein.de"],
    ["localhost:3000", "https://localhost:3000"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeWebsiteUrl(input)).toBe(expected);
  });

  it("keeps blank and non-string input for the schema to decide", () => {
    expect(normalizeWebsiteUrl("")).toBe("");
    expect(normalizeWebsiteUrl("   ")).toBe("");
    expect(normalizeWebsiteUrl(undefined)).toBeUndefined();
    expect(normalizeWebsiteUrl(null)).toBeNull();
    expect(normalizeWebsiteUrl(42)).toBe(42);
  });

  it("does not turn other schemes into http(s) URLs", () => {
    expect(normalizeWebsiteUrl("mailto:info@verein.de")).toBe("mailto:info@verein.de");
    expect(isHttpUrl(normalizeWebsiteUrl("javascript:alert(1)") as string)).toBe(false);
    expect(isHttpUrl(normalizeWebsiteUrl("ftp://verein.de") as string)).toBe(false);
  });
});

describe("normalizeInstagramUrl", () => {
  it.each([
    ["aiasdresden", "https://www.instagram.com/aiasdresden/"],
    ["@aias.dresden_", "https://www.instagram.com/aias.dresden_/"],
    ["instagram.com/aiasdresden", "https://instagram.com/aiasdresden"],
    ["https://www.instagram.com/aiasdresden/", "https://www.instagram.com/aiasdresden/"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeInstagramUrl(input)).toBe(expected);
  });

  it("keeps blank input", () => {
    expect(normalizeInstagramUrl(" ")).toBe("");
    expect(normalizeInstagramUrl(undefined)).toBeUndefined();
  });
});

describe("isHttpUrl", () => {
  it("accepts http(s) URLs with a dotted host", () => {
    expect(isHttpUrl("https://verein.de")).toBe(true);
    expect(isHttpUrl("http://www.verein.de/x")).toBe(true);
  });
  it("rejects everything else", () => {
    expect(isHttpUrl("https://localhost:3000")).toBe(false);
    expect(isHttpUrl("verein.de")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("https://")).toBe(false);
  });
});
