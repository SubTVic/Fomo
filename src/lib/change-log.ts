// SPDX-License-Identifier: AGPL-3.0-only
// Change log for groups: snapshot a group (incl. self-rating) before and after
// a write, store the field-level diff, and revert a stored diff later.
//
// Snapshot keys: Group columns from TRACKED_GROUP_FIELDS, plus
//   "selfRating"                 → whether a self-rating exists (boolean)
//   "selfRating.raterCount"      → number
//   "selfRating.filterSelections"→ sorted string[]
//   "selfRating.answers.<itemId>"→ -1 | 0 | 1 (absent = null)

import { Prisma, type PrismaClient } from "@prisma/client";

export type ChangeSource = "edit-link" | "admin" | "revert";
export type FieldValue = Prisma.JsonValue;
export type Snapshot = Record<string, FieldValue>;
export type Changes = Record<string, { from: FieldValue; to: FieldValue }>;

type Db = PrismaClient | Prisma.TransactionClient;

export const TRACKED_GROUP_FIELDS = [
  "name", "slug", "shortDescription", "longDescription", "categoryId",
  "contactEmail", "websiteUrl", "instagramUrl", "memberCount", "meetingSchedule",
  "motto", "foundedYear", "isActive", "isVerified", "registrationStatus",
  "language", "eventFrequency", "groupSize",
  "career", "tech", "socialImpact", "party", "religion", "sports", "networking",
  "arts", "music", "timeLow", "handsOn", "outdoor", "international",
  "beginnerFriendly", "competitive", "financialCost", "leadershipOpportunities",
] as const;

type TrackedField = (typeof TRACKED_GROUP_FIELDS)[number];

const RATING = "selfRating";
const RATER_COUNT = "selfRating.raterCount";
const FILTERS = "selfRating.filterSelections";
const ANSWER_PREFIX = "selfRating.answers.";

const groupSelect = {
  ...Object.fromEntries(TRACKED_GROUP_FIELDS.map((f) => [f, true])),
  selfRating: {
    select: {
      raterCount: true,
      filterSelections: true,
      answers: { select: { itemId: true, value: true } },
    },
  },
} as const;

function isTrackedField(key: string): key is TrackedField {
  return (TRACKED_GROUP_FIELDS as readonly string[]).includes(key);
}

function sortedStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === "string").sort()
    : [];
}

/** Read the tracked state of a group. Returns null if the group does not exist. */
export async function snapshotGroup(db: Db, groupId: string): Promise<Snapshot | null> {
  const group = (await db.group.findUnique({
    where: { id: groupId },
    select: groupSelect,
  })) as (Record<string, unknown> & {
    selfRating: {
      raterCount: number;
      filterSelections: Prisma.JsonValue;
      answers: { itemId: string; value: number }[];
    } | null;
  }) | null;
  if (!group) return null;

  const snapshot: Snapshot = {};
  for (const field of TRACKED_GROUP_FIELDS) {
    snapshot[field] = (group[field] ?? null) as FieldValue;
  }
  const rating = group.selfRating;
  snapshot[RATING] = rating !== null;
  if (rating) {
    snapshot[RATER_COUNT] = rating.raterCount;
    snapshot[FILTERS] = sortedStrings(rating.filterSelections);
    for (const answer of rating.answers) {
      snapshot[ANSWER_PREFIX + answer.itemId] = answer.value;
    }
  }
  return snapshot;
}

function same(a: FieldValue | undefined, b: FieldValue | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Field-level diff of two snapshots (absent keys count as null). */
export function diffSnapshots(before: Snapshot, after: Snapshot): Changes {
  const changes: Changes = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of [...keys].sort()) {
    if (!same(before[key], after[key])) {
      changes[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return changes;
}

/**
 * Decide which fields a revert may reset. A field is only reset if it still
 * holds the value the change introduced; fields changed again since then are
 * skipped so a revert never overwrites a newer edit.
 */
export function planRevert(
  changes: Changes,
  current: Snapshot,
): { values: Snapshot; skipped: string[] } {
  const values: Snapshot = {};
  const skipped: string[] = [];
  for (const [key, { from, to }] of Object.entries(changes)) {
    if (same(current[key], to)) values[key] = from;
    else if (!same(current[key], from)) skipped.push(key);
  }
  return { values, skipped };
}

/** Write snapshot values (as produced by planRevert) back to the database. */
export async function applySnapshotValues(db: Db, groupId: string, values: Snapshot) {
  const groupData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!isTrackedField(key)) continue;
    groupData[key] = value;
  }
  if (Object.keys(groupData).length > 0) {
    await db.group.update({ where: { id: groupId }, data: groupData });
  }

  const ratingKeys = Object.keys(values).filter((k) => k === RATING || k.startsWith(`${RATING}.`));
  if (ratingKeys.length === 0) return;

  if (values[RATING] === false) {
    await db.groupSelfRating.deleteMany({ where: { groupId } });
    return;
  }

  const rating =
    (await db.groupSelfRating.findUnique({ where: { groupId }, select: { id: true } })) ??
    (await db.groupSelfRating.create({
      data: { groupId, token: "revert", filterSelections: [] },
      select: { id: true },
    }));

  const ratingData: Prisma.GroupSelfRatingUpdateInput = {};
  if (RATER_COUNT in values && typeof values[RATER_COUNT] === "number") {
    ratingData.raterCount = values[RATER_COUNT];
  }
  if (FILTERS in values) ratingData.filterSelections = sortedStrings(values[FILTERS]);
  if (Object.keys(ratingData).length > 0) {
    await db.groupSelfRating.update({ where: { id: rating.id }, data: ratingData });
  }

  for (const key of ratingKeys) {
    if (!key.startsWith(ANSWER_PREFIX)) continue;
    const itemId = key.slice(ANSWER_PREFIX.length);
    const value = values[key];
    if (typeof value === "number") {
      await db.groupSelfRatingAnswer.upsert({
        where: { ratingId_itemId: { ratingId: rating.id, itemId } },
        create: { ratingId: rating.id, itemId, value },
        update: { value },
      });
    } else {
      await db.groupSelfRatingAnswer.deleteMany({ where: { ratingId: rating.id, itemId } });
    }
  }
}

/** Store the diff between two snapshots. No entry is written if nothing changed. */
export async function recordChange(
  db: Db,
  args: {
    groupId: string;
    source: ChangeSource;
    before: Snapshot;
    after: Snapshot;
    /** Admin edits are marked as seen by their author right away. */
    reviewedByEmail?: string;
  },
) {
  const changes = diffSnapshots(args.before, args.after);
  if (Object.keys(changes).length === 0) return null;
  return db.groupChangeLog.create({
    data: {
      groupId: args.groupId,
      source: args.source,
      changes: changes as Prisma.InputJsonObject,
      ...(args.reviewedByEmail
        ? { reviewedAt: new Date(), reviewedByEmail: args.reviewedByEmail }
        : {}),
    },
  });
}

/** German labels for the admin change view. */
export function fieldLabel(key: string): string {
  if (key.startsWith(ANSWER_PREFIX)) return `Antwort ${key.slice(ANSWER_PREFIX.length)}`;
  return FIELD_LABELS[key] ?? key;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  slug: "Slug",
  shortDescription: "Kurzbeschreibung",
  longDescription: "Lange Beschreibung",
  categoryId: "Kategorie",
  contactEmail: "Kontakt-E-Mail",
  websiteUrl: "Website",
  instagramUrl: "Instagram",
  memberCount: "Mitgliederzahl",
  meetingSchedule: "Treffen",
  motto: "Motto",
  foundedYear: "Gründungsjahr",
  isActive: "Aktiv",
  isVerified: "Verifiziert",
  registrationStatus: "Status",
  language: "Sprache",
  eventFrequency: "Event-Häufigkeit",
  groupSize: "Gruppengröße",
  // Column dropped in WP-5.3; label kept for older log entries.
  confirmedAttributes: "Bestätigte Attribute (alt)",
  [RATING]: "Selbsteinschätzung vorhanden",
  [RATER_COUNT]: "Anzahl Ausfüllende",
  [FILTERS]: "Aktivitäts-Filter",
};
