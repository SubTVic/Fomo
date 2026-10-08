// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import {
  communityLinkData,
  communityLinkLabelSchema,
  communityLinkUrlSchema,
} from "../community-link";

describe("community link", () => {
  it("repairs links without scheme and rejects non-web links", () => {
    expect(communityLinkUrlSchema.parse("chat.whatsapp.com/abc")).toBe("https://chat.whatsapp.com/abc");
    expect(communityLinkUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(communityLinkUrlSchema.safeParse("mailto:a@b.de").success).toBe(false);
    expect(communityLinkUrlSchema.parse("")).toBe("");
    expect(communityLinkUrlSchema.parse(null)).toBe(null);
  });

  it("limits the name to 40 characters", () => {
    expect(communityLinkLabelSchema.parse("  WhatsApp-Gruppe ")).toBe("WhatsApp-Gruppe");
    expect(communityLinkLabelSchema.safeParse("x".repeat(41)).success).toBe(false);
  });

  it("keeps both fields when nothing was sent", () => {
    expect(communityLinkData(undefined, undefined)).toEqual({});
  });

  it("drops a name without a link and allows a link without a name", () => {
    expect(communityLinkData(null, "Discord")).toEqual({ communityLinkUrl: null, communityLinkLabel: null });
    expect(communityLinkData("", "Discord")).toEqual({ communityLinkUrl: null, communityLinkLabel: null });
    expect(communityLinkData("https://discord.gg/x", "")).toEqual({
      communityLinkUrl: "https://discord.gg/x",
      communityLinkLabel: null,
    });
    expect(communityLinkData("https://discord.gg/x", " Discord ")).toEqual({
      communityLinkUrl: "https://discord.gg/x",
      communityLinkLabel: "Discord",
    });
  });
});
