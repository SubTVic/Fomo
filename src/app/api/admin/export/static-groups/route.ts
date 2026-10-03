// SPDX-License-Identifier: AGPL-3.0-only
// Export API for the "Daten-Sync" GitHub workflow (WP-4.5): returns exactly the
// public static-site/data/groups.json format — no internal or personal data
// beyond what the public site already shows.
//
// Access: a signed-in admin, or `Authorization: Bearer <EXPORT_TOKEN>` (the
// workflow). Without EXPORT_TOKEN configured, only admins can use it.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin";
import { hasValidExportToken } from "@/lib/export/export-token";
import { buildStaticGroups, staticGroupsQuery, type QuizShape } from "@/lib/export/static-groups";
import quiz from "../../../../../../static-site/data/quiz.json";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!hasValidExportToken(req.headers.get("authorization"), process.env.EXPORT_TOKEN)) {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;
  }

  const groups = await db.group.findMany(staticGroupsQuery);
  const output = buildStaticGroups(groups, quiz as QuizShape, { source: "admin app export API" });

  return new NextResponse(JSON.stringify(output, null, 2) + "\n", {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
