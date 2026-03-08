// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";

/** Default values for all editable landing page content */
export const SITE_DEFAULTS: Record<string, string> = {
  // Header
  hero_title: "Finde deine\nHochschulgruppe",
  hero_subtitle: "Launching\nWS 2026",

  // Image caption
  image_caption:
    "Campusradio Dresden · Club 11 · Die Bühne · Elbflorace · STAR Dresden · YETI — 6 von über 100 Hochschulgruppen",

  // Pilot CTA
  pilot_label: "Pilotstudie",
  pilot_title: "Hilf uns, FOMO zu bauen",
  pilot_text:
    "Wir entwickeln ein Open-Source-Tool für über 100 Hochschulgruppen in Dresden. Euer Feedback formt das Ergebnis — die Umfrage dauert nur ca. 10 Minuten.",
  pilot_button: "Zur Pilotstudie",
  pilot_duration: "~ 10 Min · Anonym",

  // 6 landing page images (src + alt)
  image_1_src: "/images/groups/Campusradio.jpeg",
  image_1_alt: "Campusradio Dresden",
  image_2_src: "/images/groups/Club11.jpg",
  image_2_alt: "Club 11",
  image_3_src: "/images/groups/DieBuilhne.jpeg",
  image_3_alt: "Die Bühne",
  image_4_src: "/images/groups/Elbflorace.png",
  image_4_alt: "Elbflorace",
  image_5_src: "/images/groups/Star.jpeg",
  image_5_alt: "STAR Dresden",
  image_6_src: "/images/groups/Yeti.jpeg",
  image_6_alt: "YETI",
};

/** Fetch all site config values, merged with defaults */
export async function getSiteConfig(): Promise<Record<string, string>> {
  const rows = await db.siteConfig.findMany();
  const config = { ...SITE_DEFAULTS };
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

/** Update a single config value (upsert) */
export async function setSiteConfig(key: string, value: string) {
  await db.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Update multiple config values at once */
export async function setSiteConfigBulk(entries: Record<string, string>) {
  const ops = Object.entries(entries).map(([key, value]) =>
    db.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    }),
  );
  await db.$transaction(ops);
}
