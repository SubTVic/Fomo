// SPDX-License-Identifier: AGPL-3.0-only
import type { NextConfig } from "next";

/**
 * Static export configuration.
 *
 * The public FOMO site ships as a plain HTML/JS bundle: no API routes, no
 * database, no server components with runtime data access. All data is read
 * from `data/*.json` at build time. See CLAUDE.md (Architektur-Prinzipien) and
 * the static-site task brief.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Static hosts have no Next.js image optimizer — serve images as-is.
  images: { unoptimized: true },
  // Emit /quiz/index.html etc. so any static host resolves clean URLs.
  trailingSlash: true,
  // This package intentionally ships no ESLint setup (the root app owns linting).
  // Skip lint-during-build so the static export stays self-contained.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
