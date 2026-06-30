// SPDX-License-Identifier: AGPL-3.0-only
import type { MetadataRoute } from "next";
import { getGroups } from "@/lib/data";
import { absUrl } from "@/lib/site";

// Emitted as /sitemap.xml at build time (works with output: 'export').
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Each logical page exists in DE and EN; link them via hreflang alternates so
  // Google serves the right language and doesn't treat them as duplicates.
  const pair = (
    dePath: string,
    enPath: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap => {
    const languages = { de: absUrl(dePath), en: absUrl(enPath) };
    return [
      { url: absUrl(dePath), lastModified: now, changeFrequency, priority, alternates: { languages } },
      { url: absUrl(enPath), lastModified: now, changeFrequency, priority, alternates: { languages } },
    ];
  };

  const staticPages = [
    ...pair("/", "/en", 1, "monthly"),
    ...pair("/quiz", "/en/quiz", 0.9, "monthly"),
    ...pair("/groups", "/en/groups", 0.8, "weekly"),
  ];

  const groupPages = getGroups().flatMap((g) =>
    pair(`/groups/${g.slug}`, `/en/groups/${g.slug}`, 0.6, "monthly"),
  );

  return [...staticPages, ...groupPages];
}
