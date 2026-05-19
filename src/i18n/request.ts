// SPDX-License-Identifier: AGPL-3.0-only
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "de" | "en")) {
    locale = routing.defaultLocale;
  }

  // Static imports avoid a webpack "lazy context module" that crashes
  // the profiling-plugin in Next.js 15.5+ with dynamic import(`${var}.json`).
  const messages =
    locale === "en"
      ? (await import("../../messages/en.json")).default
      : (await import("../../messages/de.json")).default;

  return { locale, messages };
});
