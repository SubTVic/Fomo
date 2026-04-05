// SPDX-License-Identifier: AGPL-3.0-only

import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://fomo.tu-dresden.de";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE_URL}/groups`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}
