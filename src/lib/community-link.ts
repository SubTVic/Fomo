// SPDX-License-Identifier: AGPL-3.0-only
// Community link: one free link per group with a name the group chooses
// ("WhatsApp-Gruppe", "Discord", "Telegram" …). Shared by the registration,
// edit-link and admin APIs so all three accept and store the same thing.

import { z } from "zod";
import { isHttpUrl, normalizeWebsiteUrl } from "@/lib/normalize-url";

export const COMMUNITY_LABEL_MAX = 40;

/** Link: "chat.whatsapp.com/…" is repaired to https://; null or "" = none. */
export const communityLinkUrlSchema = z.preprocess(
  normalizeWebsiteUrl,
  z.string().max(500).refine(isHttpUrl).nullable().optional().or(z.literal("")),
);

export const communityLinkLabelSchema = z
  .string()
  .trim()
  .max(COMMUNITY_LABEL_MAX)
  .nullable()
  .optional()
  .or(z.literal(""));

/**
 * Database fields for a submitted link + name. A name without a link means
 * nothing and is dropped; a link without a name is fine (the site shows a
 * default). undefined for both = field not sent, keep what is stored.
 */
export function communityLinkData(
  url: string | null | undefined,
  label: string | null | undefined,
): { communityLinkUrl?: string | null; communityLinkLabel?: string | null } {
  if (url === undefined && label === undefined) return {};
  const link = url?.trim() || null;
  return {
    communityLinkUrl: link,
    communityLinkLabel: link ? label?.trim() || null : null,
  };
}
