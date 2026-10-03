// SPDX-License-Identifier: AGPL-3.0-only
// API: Full database export (admin only) — downloads JSON snapshot of all tables.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const [
    categories,
    groups,
    groupInvites,
    groupContacts,
    groupSelfRatings,
    groupSelfRatingAnswers,
    groupChangeLogs,
    groupEditTokens,
    admins,
  ] = await Promise.all([
    db.category.findMany(),
    db.group.findMany(),
    db.groupInvite.findMany(),
    db.groupContact.findMany(),
    db.groupSelfRating.findMany(),
    db.groupSelfRatingAnswer.findMany(),
    db.groupChangeLog.findMany(),
    db.groupEditToken.findMany(),
    db.admin.findMany({
      // omit password hashes from backup for safety
      select: {
        id: true,
        email: true,
        name: true,
        ssoId: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const snapshot = {
    meta: {
      exportedAt: new Date().toISOString(),
      // 2: pilot, study 2, prototype-quiz and CMS tables dropped (WP-5.3).
      version: 2,
      note: "Admin password hashes are intentionally omitted.",
    },
    categories,
    groups,
    groupInvites,
    groupContacts,
    groupSelfRatings,
    groupSelfRatingAnswers,
    groupChangeLogs,
    groupEditTokens,
    admins,
  };

  const filename = `fomo-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
