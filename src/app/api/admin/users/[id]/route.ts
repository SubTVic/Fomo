// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]).optional(),
  isActive: z.boolean().optional(),
});

const LAST_SUPER_ADMIN_ERROR =
  "Der letzte aktive Super-Admin kann nicht gelöscht, deaktiviert oder herabgestuft werden.";

/** True if this admin is the only remaining active SUPER_ADMIN. */
async function isLastActiveSuperAdmin(admin: { role: string; isActive: boolean }) {
  if (admin.role !== "SUPER_ADMIN" || !admin.isActive) return false;
  const activeSuperAdmins = await db.admin.count({
    where: { role: "SUPER_ADMIN", isActive: true },
  });
  return activeSuperAdmins <= 1;
}

// PUT /api/admin/users/[id] — update admin
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.admin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const losesSuperAdmin =
    parsed.data.isActive === false ||
    (parsed.data.role !== undefined && parsed.data.role !== "SUPER_ADMIN");
  if (losesSuperAdmin && (await isLastActiveSuperAdmin(existing))) {
    return NextResponse.json({ error: LAST_SUPER_ADMIN_ERROR }, { status: 409 });
  }

  // Check email uniqueness if changing email
  if (parsed.data.email && parsed.data.email !== existing.email) {
    const emailTaken = await db.admin.findUnique({
      where: { email: parsed.data.email },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 409 },
      );
    }
  }

  const admin = await db.admin.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ admin });
}

// DELETE /api/admin/users/[id] — delete admin
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
  if (!guard.ok) return guard.response;

  const { id } = await params;

  // Prevent self-deletion
  if (guard.admin.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  const existing = await db.admin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  if (await isLastActiveSuperAdmin(existing)) {
    return NextResponse.json({ error: LAST_SUPER_ADMIN_ERROR }, { status: 409 });
  }

  await db.admin.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
