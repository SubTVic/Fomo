#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
//
// Summarise what changed between two groups.json files, as Markdown for the
// "Daten-Sync" pull request (WP-4.5).
//
//   node scripts/diff-groups.mjs <old-groups.json> <new-groups.json> [--max-removed-share 0.2]
//
// With --max-removed-share the script exits with code 2 if more than that share
// of the old groups would disappear (protects against syncing from a wrong or
// empty database).

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const FIELD_LABELS = {
  name: "Name",
  slug: "Slug",
  shortDescription: "Kurzbeschreibung",
  longDescription: "Beschreibung",
  categoryName: "Kategorie",
  websiteUrl: "Website",
  instagramUrl: "Instagram",
  contactEmail: "Kontakt",
  memberCount: "Mitglieder",
  motto: "Motto",
  foundedYear: "Gründungsjahr",
  nextEvent: "Nächstes Event",
  "selfRating.derived": "Verifizierung (im Quiz ja/nein)",
  "selfRating.answers": "Quiz-Antworten",
  "selfRating.filterSelections": "Aktivitäts-Filter",
  "selfRating.raterCount": "Anzahl Ausfüllende",
};

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function changedFields(a, b) {
  const fields = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (key === "selfRating") {
      for (const sub of ["derived", "answers", "filterSelections", "raterCount"]) {
        if (!same(a.selfRating?.[sub], b.selfRating?.[sub])) fields.push(`selfRating.${sub}`);
      }
    } else if (key !== "id" && !same(a[key], b[key])) {
      fields.push(key);
    }
  }
  return fields;
}

/** Compare by group id (slugs may change). */
export function diffGroups(oldData, newData) {
  const oldById = new Map(oldData.groups.map((g) => [g.id, g]));
  const newById = new Map(newData.groups.map((g) => [g.id, g]));
  const added = newData.groups.filter((g) => !oldById.has(g.id));
  const removed = oldData.groups.filter((g) => !newById.has(g.id));
  const changed = [];
  for (const g of newData.groups) {
    const before = oldById.get(g.id);
    if (!before) continue;
    const fields = changedFields(before, g);
    if (fields.length > 0) changed.push({ name: g.name, slug: g.slug, fields });
  }
  const count = (d) => ({
    total: d.groups.length,
    verified: d.groups.filter((g) => g.selfRating && g.selfRating.derived === false).length,
  });
  return { before: count(oldData), after: count(newData), added, removed, changed };
}

/** True if more than `maxShare` of the previously published groups would disappear. */
export function removesTooMany(diff, maxShare) {
  return diff.before.total > 0 && diff.removed.length / diff.before.total > maxShare;
}

export function formatMarkdown(diff) {
  const lines = [
    `**Gruppen:** ${diff.before.total} → ${diff.after.total} · **im Quiz (verifiziert):** ${diff.before.verified} → ${diff.after.verified}`,
    "",
  ];
  if (!diff.added.length && !diff.removed.length && !diff.changed.length) {
    lines.push("Keine inhaltlichen Änderungen.");
    return lines.join("\n");
  }
  for (const g of diff.added) lines.push(`- ➕ **neu:** ${g.name} (\`${g.slug}\`)`);
  for (const g of diff.removed) lines.push(`- ➖ **entfernt/deaktiviert:** ${g.name} (\`${g.slug}\`)`);
  for (const g of diff.changed) {
    const labels = g.fields.map((f) => FIELD_LABELS[f] ?? f).join(", ");
    lines.push(`- ✏️ ${g.name} (\`${g.slug}\`): ${labels}`);
  }
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const [oldPath, newPath] = args;
  if (!oldPath || !newPath) {
    console.error("Usage: node scripts/diff-groups.mjs <old-groups.json> <new-groups.json> [--max-removed-share 0.2]");
    process.exit(1);
  }
  const shareIdx = args.indexOf("--max-removed-share");
  const maxShare = shareIdx > -1 ? Number(args[shareIdx + 1]) : null;
  const read = (p) => JSON.parse(readFileSync(p, "utf8"));
  const diff = diffGroups(read(oldPath), read(newPath));
  console.log(formatMarkdown(diff));
  if (maxShare !== null && removesTooMany(diff, maxShare)) {
    console.error(
      `\nAbbruch: ${diff.removed.length} von ${diff.before.total} Gruppen würden verschwinden ` +
        `(mehr als ${Math.round(maxShare * 100)} %). Zeigt EXPORT_URL auf die richtige Datenbank?`,
    );
    process.exit(2);
  }
}
