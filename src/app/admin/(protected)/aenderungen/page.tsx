// SPDX-License-Identifier: AGPL-3.0-only

export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdminPage } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { fieldLabel, type Changes, type FieldValue } from "@/lib/change-log";
import { ChangeActions } from "./ChangeActions";

const SOURCE_LABELS: Record<string, string> = {
  "edit-link": "Bearbeitungslink",
  admin: "Admin",
  revert: "Rückgängig",
};

export default async function ChangesPage() {
  await requireAdminPage();

  const [open, recent, categories] = await Promise.all([
    db.groupChangeLog.findMany({
      where: { reviewedAt: null },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.groupChangeLog.findMany({
      where: { reviewedAt: { not: null } },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.category.findMany({ select: { id: true, name: true } }),
  ]);
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  function format(key: string, value: FieldValue): string {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "categoryId" && typeof value === "string") return categoryNames.get(value) ?? value;
    if (typeof value === "boolean") return value ? "ja" : "nein";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function Entry({ entry, canMarkSeen }: { entry: (typeof open)[number]; canMarkSeen: boolean }) {
    const changes = entry.changes as Changes;
    return (
      <li className="border-2 border-foreground bg-background p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href={`/admin/groups/${entry.group.id}`} className="font-semibold hover:underline">
              {entry.group.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {SOURCE_LABELS[entry.source] ?? entry.source} ·{" "}
              {entry.createdAt.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
              {entry.reviewedByEmail ? ` · gesehen von ${entry.reviewedByEmail}` : ""}
            </p>
          </div>
          <ChangeActions id={entry.id} canMarkSeen={canMarkSeen} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/30 text-left text-xs uppercase text-muted-foreground">
                <th className="py-1 pr-4">Feld</th>
                <th className="py-1 pr-4">Vorher</th>
                <th className="py-1">Nachher</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(changes).map(([key, { from, to }]) => (
                <tr key={key} className="border-b border-foreground/10 align-top">
                  <td className="py-1 pr-4 font-medium">{fieldLabel(key)}</td>
                  <td className="py-1 pr-4 text-muted-foreground line-through decoration-1">
                    {format(key, from)}
                  </td>
                  <td className="py-1">{format(key, to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </li>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-heading text-2xl uppercase">Änderungen</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Änderungen bereits verifizierter Gruppen gehen direkt live. Hier siehst du, was sich
        geändert hat, und kannst es zurücknehmen. „Rückgängig“ setzt nur Felder zurück, die
        seitdem nicht erneut geändert wurden.
      </p>

      <h2 className="mb-3 font-heading text-lg uppercase">Ungesehen ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">Keine ungesehenen Änderungen.</p>
      ) : (
        <ul className="mb-8 space-y-4">
          {open.map((entry) => (
            <Entry key={entry.id} entry={entry} canMarkSeen />
          ))}
        </ul>
      )}

      <h2 className="mb-3 font-heading text-lg uppercase">Zuletzt gesehen</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch nichts.</p>
      ) : (
        <ul className="space-y-4">
          {recent.map((entry) => (
            <Entry key={entry.id} entry={entry} canMarkSeen={false} />
          ))}
        </ul>
      )}
    </div>
  );
}
