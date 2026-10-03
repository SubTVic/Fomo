// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: delete a single contact person (Löschkonzept, WP-5.5), e.g. on
// request of the person or when they left the group. Super admins only.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { count } = await db.groupContact.deleteMany({ where: { id } });
  if (count === 0) {
    return NextResponse.json({ error: "Kontakt nicht gefunden." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
