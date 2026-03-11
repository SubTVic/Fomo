// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: list groups (supports filtering for invite generation)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
