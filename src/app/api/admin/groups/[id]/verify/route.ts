// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: verify (or unverify) a group

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await db.group.findUnique({ where: { id } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const nowVerified = !group.isVerified;
  const updated = await db.group.update({
    where: { id },
    data: {
      isVerified: nowVerified,
      registrationStatus: nowVerified ? "verified" : group.registrationStatus,
      verifiedAt: nowVerified ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, isVerified: updated.isVerified });
}
