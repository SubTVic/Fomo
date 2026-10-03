// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computePilotStatistics, type StatsFilter } from "@/lib/queries/pilot-statistics";

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const filter: StatsFilter = {};
  if (searchParams.get("semester")) filter.semester = searchParams.get("semester")!;
  if (searchParams.get("isMember")) filter.isMember = searchParams.get("isMember")!;

  const stats = await computePilotStatistics(filter);
  return NextResponse.json(stats);
}
