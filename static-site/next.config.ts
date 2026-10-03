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
// Optional subpath, e.g. when the StuRa server hosts FOMO under /fomo.
// Must start with "/" and have no trailing slash. Inlined at build time.
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const basePath = rawBasePath && rawBasePath !== "/" ? rawBasePath.replace(/\/$/, "") : "";

const nextConfig: NextConfig = {
  output: "export",
  // Static hosts have no Next.js image optimizer — serve images as-is.
  images: { unoptimized: true },
  // Emit /quiz/index.html etc. so any static host resolves clean URLs.
  trailingSlash: true,
  // Serve under a subpath if configured (otherwise root). assetPrefix keeps
  // /_next/* assets resolving correctly behind the prefix.
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // This folder is its own project. Without a fixed root, Turbopack picks the
  // repo root (it has a lockfile too) and pulls in the root app's middleware.
  turbopack: { root: __dirname },
  // Linting is a separate step since Next.js 16 (`npm run lint`, eslint.config.mjs).
};

export default nextConfig;
