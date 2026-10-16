// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { signOut } from "@/lib/auth";
import { requireAdminPage } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { findAdminsWithDefaultPassword } from "@/lib/default-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const openChanges = await db.groupChangeLog.count({ where: { reviewedAt: null } });
  const defaultPasswordAdmins = await findAdminsWithDefaultPassword(
    await db.admin.findMany({
      where: { isActive: true },
      select: { id: true, email: true, passwordHash: true },
    }),
  );

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <header className="border-b-4 border-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-heading text-lg uppercase border-2 border-foreground px-2.5 py-1">FOMO Admin</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <Link href="/admin/groups" className="hover:underline">Gruppen</Link>
            <Link href="/admin/aenderungen" className="hover:underline">
              Änderungen{openChanges > 0 ? ` (${openChanges})` : ""}
            </Link>
            <Link href="/admin/contacts" className="hover:underline">Kontakte</Link>
            {admin.role === "SUPER_ADMIN" && (
              <Link href="/admin/users" className="hover:underline">Admins</Link>
            )}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Abmelden
            </button>
          </form>
        </div>
      </header>
      {defaultPasswordAdmins.length > 0 && (
        <div role="alert" className="border-b-4 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">
          <div className="mx-auto max-w-5xl">
            <strong className="uppercase">Sicherheitswarnung:</strong>{" "}
            {defaultPasswordAdmins.map((a) => a.email).join(", ")}{" "}
            {defaultPasswordAdmins.length === 1 ? "nutzt" : "nutzen"} noch das Standardpasswort
            aus dem Seed. Es ist im öffentlichen Repository einsehbar — bitte sofort zurücksetzen
            oder das Konto deaktivieren.{" "}
            {admin.role === "SUPER_ADMIN" ? (
              <Link href="/admin/users" className="font-semibold underline">
                Zu den Admins
              </Link>
            ) : (
              "Bitte einen SUPER_ADMIN informieren."
            )}
          </div>
        </div>
      )}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
