// SPDX-License-Identifier: AGPL-3.0-only

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <header className="border-b-4 border-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-heading text-lg uppercase border-2 border-foreground px-2.5 py-1">FOMO Admin</span>
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="hover:underline">Dashboard</a>
            <a href="/admin/groups" className="hover:underline">Gruppen</a>
            <a href="/admin/questions" className="hover:underline">Fragen</a>
          </nav>
          <form action="/api/auth/signout" method="POST">
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
