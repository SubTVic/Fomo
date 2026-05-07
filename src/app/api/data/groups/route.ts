// SPDX-License-Identifier: AGPL-3.0-only
// Public JSON bundle of all active groups for client-side matching.
// Cached 5 min, stale-while-revalidate 1 hour.
// Later: swap for a static file at /data/groups.json (no code change needed in client).

import { NextResponse } from "next/server";
import { getQuizGroups } from "@/lib/queries/quiz";

export async function GET() {
  const groups = await getQuizGroups();

  return NextResponse.json(groups, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
