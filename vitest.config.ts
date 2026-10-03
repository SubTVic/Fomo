// SPDX-License-Identifier: AGPL-3.0-only
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirror the "@/*" path alias from tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Unit tests only; Playwright specs in tests/ run via `npm run test:e2e`.
    include: ["src/**/*.test.ts"],
    exclude: ["tests/**", "static-site/**", ".claude/**", "node_modules/**"],
  },
});
