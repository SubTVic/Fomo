// SPDX-License-Identifier: AGPL-3.0-only
// "Abgleich mit Website": take over corrections that were made on the public
// site (static-site/data/groups.json, data/areas.json) into the database, so
// the next "Daten-Sync" does not undo them. Field by field, logged, revertible.

export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdminPage } from "@/lib/require-admin";
import { loadWebsiteComparison } from "@/lib/website-sync-load";
import { WEBSITE_GROUPS_URL } from "@/lib/website-sync";
import { GroupDiffForm } from "./GroupDiffForm";

export default async function WebsiteSyncPage() {
  await requireAdminPage();

  let comparison;
  let loadError: string | null = null;
  try {
    comparison = await loadWebsiteComparison();
  } catch (e) {
    loadError = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-heading text-2xl uppercase">Abgleich mit Website</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Hier stehen Felder, in denen die Live-Website (<code className="text-xs">{WEBSITE_GROUPS_URL}</code>{" "}
        plus Bereichs-Zuordnung) von der Datenbank abweicht. Hake an, welche <strong>Website-Werte</strong> in
        die Datenbank übernommen werden sollen. Jede Übernahme steht im{" "}
        <Link href="/admin/aenderungen" className="underline">Änderungsprotokoll</Link> und lässt sich dort
        rückgängig machen. Verifizierung, Aktiv-Status und Links/Tokens werden nie angefasst; Gruppen werden
        weder angelegt noch gelöscht.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Faustregel: Steht hier eine Gruppe, hat entweder jemand die Website direkt korrigiert (dann
        übernehmen) oder die Gruppe hat sich seit dem letzten Daten-Sync geändert (dann <em>nicht</em>{" "}
        übernehmen — der nächste Daten-Sync bringt die neuen Werte auf die Website).
      </p>

      {loadError && (
        <p className="mt-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {comparison && (
        <>
          <p className="mt-6 text-sm font-medium">
            {comparison.groups.length === 0
              ? "✓ Keine Abweichungen — Website und Datenbank stimmen überein."
              : `${comparison.groups.length} Gruppe(n) mit Abweichungen.`}
          </p>

          {comparison.unknownCategories.length > 0 && (
            <p className="mt-3 border-2 border-yellow-400 bg-yellow-50 px-4 py-2 text-xs text-yellow-900">
              Kategorien auf der Website, die es in der Datenbank nicht gibt (erst unter Kategorien anlegen):{" "}
              {comparison.unknownCategories.join(", ")}
            </p>
          )}

          <ul className="mt-4 space-y-4">
            {comparison.groups.map((g) => (
              <li key={g.groupId}>
                <GroupDiffForm group={g} />
              </li>
            ))}
          </ul>

          {(comparison.onlyOnWebsite.length > 0 || comparison.onlyInDb.length > 0) && (
            <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <h2 className="font-heading uppercase">Nur auf der Website</h2>
                <p className="text-xs text-muted-foreground">
                  In der Datenbank gelöscht oder deaktiviert — verschwindet mit dem nächsten Daten-Sync.
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {comparison.onlyOnWebsite.map((g) => <li key={g.id}>{g.name}</li>)}
                </ul>
              </div>
              <div>
                <h2 className="font-heading uppercase">Nur in der Datenbank</h2>
                <p className="text-xs text-muted-foreground">Neu seit dem letzten Daten-Sync.</p>
                <ul className="mt-2 list-disc pl-5">
                  {comparison.onlyInDb.map((g) => (
                    <li key={g.id}>
                      <Link href={`/admin/groups/${g.id}`} className="hover:underline">{g.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
