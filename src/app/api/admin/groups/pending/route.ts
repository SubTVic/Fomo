// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: list groups (supports filtering for invite generation)

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const groups = await db.group.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      registrationStatus: true,
      registeredVia: true,
      isVerified: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ groups });
}
