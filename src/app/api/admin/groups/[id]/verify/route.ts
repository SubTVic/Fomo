// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: verify (or unverify) a group

import { NextRequest, NextResponse } from "next/server";
import { RegistrationStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { recordChange, snapshotGroup } from "@/lib/change-log";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const group = await db.group.findUnique({ where: { id } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const nowVerified = !group.isVerified;
  const updated = await db.$transaction(async (tx) => {
    const before = await snapshotGroup(tx, id);
    const result = await tx.group.update({
      where: { id },
      data: {
        isVerified: nowVerified,
        registrationStatus: nowVerified ? RegistrationStatus.VERIFIED : group.registrationStatus,
        verifiedAt: nowVerified ? new Date() : null,
      },
    });
    const after = await snapshotGroup(tx, id);
    if (before && after) {
      await recordChange(tx, { groupId: id, source: "admin", before, after, reviewedByEmail: guard.admin.email });
    }
    return result;
  });

  return NextResponse.json({ ok: true, isVerified: updated.isVerified });
}
