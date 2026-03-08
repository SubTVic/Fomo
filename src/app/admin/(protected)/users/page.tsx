// SPDX-License-Identifier: AGPL-3.0-only

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateAdminForm } from "./CreateAdminForm";
import { EditAdminButton } from "./EditAdminButton";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { DeleteAdminButton } from "./DeleteAdminButton";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") redirect("/admin");

  const admins = await db.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const currentUserId = session.user.id as string;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl uppercase">Admins</h1>
        <CreateAdminForm />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-2 border-foreground">
          <thead>
            <tr className="border-b-2 border-foreground bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-heading uppercase">Name</th>
              <th className="px-4 py-3 text-left text-sm font-heading uppercase">E-Mail</th>
              <th className="px-4 py-3 text-left text-sm font-heading uppercase">Rolle</th>
              <th className="px-4 py-3 text-left text-sm font-heading uppercase">Status</th>
              <th className="px-4 py-3 text-left text-sm font-heading uppercase">Letzter Login</th>
              <th className="px-4 py-3 text-right text-sm font-heading uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-foreground/20">
                <td className="px-4 py-3 text-sm">{admin.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm">{admin.email}</td>
                <td className="px-4 py-3 text-sm">
                  <RoleBadge role={admin.role} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge isActive={admin.isActive} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {admin.lastLoginAt
                    ? new Date(admin.lastLoginAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditAdminButton admin={admin} />
                    <ResetPasswordButton adminId={admin.id} adminName={admin.name ?? admin.email} />
                    <DeleteAdminButton
                      adminId={admin.id}
                      adminName={admin.name ?? admin.email}
                      isSelf={admin.id === currentUserId}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-heading uppercase ${
        isSuperAdmin
          ? "bg-foreground text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isSuperAdmin ? "Super Admin" : "Editor"}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs ${
        isActive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
      }`}
    >
      {isActive ? "Aktiv" : "Inaktiv"}
    </span>
  );
}
