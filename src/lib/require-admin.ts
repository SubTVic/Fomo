// SPDX-License-Identifier: AGPL-3.0-only

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type AdminRole = "SUPER_ADMIN" | "EDITOR";

export interface CurrentAdmin {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

export interface RequireAdminOptions {
  /** Require this role. Checked against the database, never the session token. */
  role?: "SUPER_ADMIN";
}

export type AdminApiGuard =
  | { ok: true; admin: CurrentAdmin }
  | { ok: false; response: NextResponse };

/**
 * Resolve the currently signed-in, active admin from the database.
 * Fails closed: anything unexpected (no session, malformed session, unknown or
 * deactivated admin, auth error) yields null.
 */
export async function getActiveAdmin(): Promise<CurrentAdmin | null> {
  let session: unknown;
  try {
    session = await auth();
  } catch {
    return null;
  }

  const user =
    session && typeof session === "object" && "user" in session
      ? (session as { user?: unknown }).user
      : undefined;
  const email =
    user && typeof user === "object" && "email" in user
      ? (user as { email?: unknown }).email
      : undefined;
  if (typeof email !== "string" || email.length === 0) return null;

  const admin = await db.admin.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!admin || admin.isActive !== true) return null;

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

function hasRole(admin: CurrentAdmin, opts?: RequireAdminOptions): boolean {
  return !opts?.role || admin.role === opts.role;
}

/** Guard for API route handlers: returns the admin or a ready-made 401/403 response. */
export async function requireAdminApi(opts?: RequireAdminOptions): Promise<AdminApiGuard> {
  const admin = await getActiveAdmin();
  if (!admin) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasRole(admin, opts)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, admin };
}

/** Guard for admin Server Components: redirects instead of rendering. */
export async function requireAdminPage(opts?: RequireAdminOptions): Promise<CurrentAdmin> {
  const admin = await getActiveAdmin();
  if (!admin) redirect("/admin/login");
  if (!hasRole(admin, opts)) redirect("/admin");
  return admin;
}
