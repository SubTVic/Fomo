// SPDX-License-Identifier: AGPL-3.0-only
import type { Group } from "./types";
// Canonical site origin for SEO (absolute URLs in sitemap, robots, canonical,
// OpenGraph). Resolution order:
//   1. NEXT_PUBLIC_SITE_URL  — set this to the real custom domain in production.
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects this at build time.
//   3. http://localhost:3000 — local dev fallback.
// All values are inlined at build time (static export), so a rebuild is needed
// after changing the domain.

const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const raw = fromEnv || (fromVercel ? `https://${fromVercel}` : "http://localhost:3000");

export const SITE_URL = raw.replace(/\/$/, "");

// Optional subpath (mirrors next.config.ts), e.g. when hosted under /fomo.
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
export const BASE_PATH = rawBase && rawBase !== "/" ? rawBase.replace(/\/$/, "") : "";

/** Site-root-relative path, normalised with a trailing slash (matches the export). */
export function sitePath(path: string): string {
  if (!path || path === "/") return `${BASE_PATH}/`;
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `${BASE_PATH}/${clean}/`;
}

/** Absolute URL for a site-root-relative path. */
export function absUrl(path: string): string {
  return `${SITE_URL}${sitePath(path)}`;
}

/** Absolute URL for a static asset (no trailing slash). Passes external URLs through. */
export function absAsset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${BASE_PATH}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** schema.org Organization JSON-LD for one group's detail page (rich results). */
export function groupOrganizationLd(group: Group, lang: "de" | "en", description: string) {
  const sameAs = [group.websiteUrl, group.instagramUrl].filter(Boolean) as string[];
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: group.name,
    description,
    url: absUrl(lang === "en" ? `/en/groups/${group.slug}` : `/groups/${group.slug}`),
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Technische Universität Dresden",
    },
  };
  if (sameAs.length) ld.sameAs = sameAs;
  if (group.contactEmail) ld.email = group.contactEmail;
  if (group.logoUrl) ld.logo = absAsset(group.logoUrl);
  if (group.foundedYear) ld.foundingDate = String(group.foundedYear);
  return ld;
}

/**
 * hreflang/canonical block for a page that exists in both languages.
 * Next.js resolves the relative paths against `metadataBase`.
 */
export function seoAlternates(de: string, en: string, current: "de" | "en") {
  return {
    canonical: current === "de" ? sitePath(de) : sitePath(en),
    languages: {
      "de-DE": sitePath(de),
      "en-US": sitePath(en),
      "x-default": sitePath(de),
    },
  };
}
