// SPDX-License-Identifier: AGPL-3.0-only
// Admin API: create a reusable edit link for a group (POST) or revoke all of
// its links (DELETE). The link is only returned once; the database stores a hash.

import { NextRequest, NextResponse } from "next/server";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { createEditToken, editLink, revokeEditTokens } from "@/lib/edit-token";

const postSchema = z.object({ revokeOthers: z.boolean().default(false) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const group = await db.group.findUnique({ where: { id }, select: { id: true } });
  if (!group) {
    return NextResponse.json({ error: "Gruppe nicht gefunden." }, { status: 404 });
  }

  const { token, expiresAt } = await db.$transaction(async (tx) => {
    const created = await createEditToken(tx, id, { revokeOthers: parsed.data.revokeOthers });
    await tx.group.updateMany({
      where: { id, registrationStatus: null },
      data: { registrationStatus: RegistrationStatus.INVITED },
    });
    return created;
  });

  return NextResponse.json({
    ok: true,
    link: editLink(req.nextUrl.origin, token),
    expiresAt: expiresAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const revoked = await revokeEditTokens(db, id);
  return NextResponse.json({ ok: true, revoked });
}
