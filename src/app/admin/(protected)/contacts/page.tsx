// SPDX-License-Identifier: AGPL-3.0-only

export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";

export default async function ContactsPage() {
  const contacts = await db.groupContact.findMany({
    include: {
      group: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csvHref =
    "data:text/csv;charset=utf-8," +
    encodeURIComponent(
      ["gruppe,name,email,rolle,verantwortlich,quelle,erstellt"]
        .concat(
          contacts.map((c) =>
            [
              `"${c.group?.name ?? ""}"`,
              `"${c.name}"`,
              `"${c.email}"`,
              `"${c.role ?? ""}"`,
              c.isResponsible ? "ja" : "nein",
              c.source,
              c.createdAt.toISOString(),
            ].join(","),
          ),
        )
        .join("\n"),
    );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl uppercase">Kontakte</h1>
        {contacts.length > 0 && (
          <a
            href={csvHref}
            download="fomo-kontakte.csv"
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            CSV-Export
          </a>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Verantwortliche Ansprechpersonen, die bei der Gruppen-Registrierung bestätigt haben,
        die Gruppe nach außen zu repräsentieren.
      </p>

      {contacts.length === 0 ? (
        <p className="rounded border border-dashed border-foreground/30 px-4 py-12 text-center text-sm text-muted-foreground">
          Noch keine Kontakte erfasst.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Gruppe</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">E-Mail</th>
                <th className="px-3 py-2 font-medium">Rolle</th>
                <th className="px-3 py-2 font-medium">Verantwortlich</th>
                <th className="px-3 py-2 font-medium">Quelle</th>
                <th className="px-3 py-2 font-medium">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">
                    {c.group ? (
                      <Link
                        href={`/admin/groups/${c.group.id}`}
                        className="underline hover:text-foreground"
                      >
                        {c.group.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`mailto:${c.email}`}
                      className="underline hover:text-foreground"
                    >
                      {c.email}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.role ?? "—"}</td>
                  <td className="px-3 py-2">
                    {c.isResponsible ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        ja
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">nein</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{c.source}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {c.createdAt.toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
