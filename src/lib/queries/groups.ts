// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { PublicGroup } from "@/types";

// Explicit allow-list of fields that may be rendered publicly.
const publicGroupSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  isVerified: true,
  memberCount: true,
  meetingSchedule: true,
  websiteUrl: true,
  instagramUrl: true,
  contactEmail: true,
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.GroupSelect;

// All active groups with their category (for overview page), public fields only
export async function getActiveGroups(): Promise<PublicGroup[]> {
  return db.group.findMany({
    where: { isActive: true },
    select: publicGroupSelect,
    orderBy: { name: "asc" },
  });
}

// Count of active groups (for landing page stats)
export async function getActiveGroupCount(): Promise<number> {
  return db.group.count({ where: { isActive: true } });
}

// All groups including inactive (for admin)
export async function getAllGroupsForAdmin() {
  return db.group.findMany({
    include: {
      category: true,
      duplicateOf: { select: { id: true, name: true } },
      selfRating: { select: { _count: { select: { answers: true } } } },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}
