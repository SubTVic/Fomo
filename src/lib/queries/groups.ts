// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";

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
