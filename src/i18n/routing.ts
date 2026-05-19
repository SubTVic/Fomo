// SPDX-License-Identifier: AGPL-3.0-only
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  // /de/... stays as / (no prefix for default), /en/... has prefix
  localePrefix: "as-needed",
});
