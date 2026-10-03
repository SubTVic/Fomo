// SPDX-License-Identifier: AGPL-3.0-only
// Hand-written English group descriptions live in data/group-translations.json
// (with a sourceHash that validate-data.mjs uses to flag outdated translations).

import data from "../../data/group-translations.json";

/** English description by group slug. */
export const groupTranslations: Record<string, string> = Object.fromEntries(
  Object.entries(data.translations as Record<string, { text: string }>).map(([slug, t]) => [slug, t.text]),
);
