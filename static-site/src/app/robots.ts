// SPDX-License-Identifier: AGPL-3.0-only
import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/site";

// Emitted as /robots.txt at build time (works with output: 'export').
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // /report/ is the build-time analytics report — public but not for search.
    rules: { userAgent: "*", allow: "/", disallow: "/report/" },
    sitemap: absUrl("/sitemap.xml").replace(/\/$/, ""),
    host: absUrl("/").replace(/\/$/, ""),
  };
}
