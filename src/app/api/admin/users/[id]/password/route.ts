// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";

const resetSchema = z.object({
  password: z.string().min(8),
});

// PUT /api/admin/users/[id]/password — reset admin password
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const body = await req.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const existing = await db.admin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.admin.update({
    where: { id },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true });
}
