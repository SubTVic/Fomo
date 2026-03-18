// SPDX-License-Identifier: AGPL-3.0-only

import type { Category, Group } from "@prisma/client";

// ---------------------------------------------------------------------------
// Data types (derived from Prisma models)
// ---------------------------------------------------------------------------

// Group with category only (used in group overview and admin)
export type GroupWithCategory = Group & {
  category: Category;
};
