// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";
import type { GroupWithCategory, GroupWithProfile } from "@/types";

// All active groups with their category (for overview page)
export async function getActiveGroups(): Promise<GroupWithCategory[]> {
  return db.group.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

// All active groups with full profiles (for client-side matching)
export async function getGroupsWithProfiles(): Promise<GroupWithProfile[]> {
  return db.group.findMany({
    where: { isActive: true },
    include: {
      category: true,
      profiles: {
        include: {
          question: {
            include: { options: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

// Single group by slug (for detail view)
export async function getGroupBySlug(slug: string): Promise<GroupWithCategory | null> {
  return db.group.findUnique({
    where: { slug, isActive: true },
    include: { category: true },
  });
}

// Count of active groups (for landing page stats)
export async function getActiveGroupCount(): Promise<number> {
  return db.group.count({ where: { isActive: true } });
}

// All groups including inactive (for admin)
export async function getAllGroupsForAdmin() {
  return db.group.findMany({
    include: { category: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}
