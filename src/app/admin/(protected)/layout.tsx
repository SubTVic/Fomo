// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { signOut } from "@/lib/auth";
import { requireAdminPage } from "@/lib/require-admin";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const openChanges = await db.groupChangeLog.count({ where: { reviewedAt: null } });

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
            <Link href="/admin/users" className="hover:underline">Admins</Link>
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
