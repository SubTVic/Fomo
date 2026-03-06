// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: list groups pending verification

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await db.group.findMany({
    where: { isVerified: false, registeredVia: "survey" },
    include: { category: true },
    orderBy: { registeredAt: "desc" },
  });

  return NextResponse.json({ groups });
}
