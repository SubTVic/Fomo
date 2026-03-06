// SPDX-License-Identifier: AGPL-3.0-only

import { getAllGroupsForAdmin } from "@/lib/queries/groups";

export default async function AdminGroupsPage() {
  const groups = await getAllGroupsForAdmin();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hochschulgruppen</h1>
        <span className="text-sm text-muted-foreground">{groups.length} gesamt</span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Kategorie</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Verifiziert</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{group.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{group.category.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${group.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                    {group.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {group.isVerified ? "Ja" : "Nein"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
