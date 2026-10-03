// SPDX-License-Identifier: AGPL-3.0-only

import { PUBLIC_SITE_URL, SYNC_WORKFLOW_URL } from "@/lib/public-site";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminDashboard() {
  await requireAdminPage();
  const [groupCount, pilotCount] = await Promise.all([
    db.group.count({ where: { isActive: true } }),
    db.pilotSession.count({ where: { completedAt: { not: null } } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl uppercase">Dashboard</h1>
        <a
          href="/api/admin/backup"
          download
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
          title="Vollständiges JSON-Backup aller Tabellen herunterladen"
        >
          Backup herunterladen
        </a>
      </div>

      <section className="mb-8 border-2 border-foreground bg-background p-5">
        <h2 className="font-heading text-lg uppercase">Website aktualisieren</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Änderungen in dieser App erscheinen erst nach einem Daten-Sync auf{" "}
          {PUBLIC_SITE_URL.replace("https://", "")}. Auf GitHub → <strong>Run workflow</strong>{" "}
          klicken; es entsteht ein Pull Request mit allen Änderungen. Nach grüner Prüfung mergen –
          ca. 2 Minuten später ist es live.
        </p>
        <a
          href={SYNC_WORKFLOW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block bg-foreground px-4 py-2 text-sm font-semibold uppercase text-background hover:opacity-90"
        >
          Daten-Sync öffnen (GitHub)
        </a>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aktive Gruppen" value={groupCount} href="/admin/groups" />
        <StatCard label="Pilot-Sessions" value={pilotCount} href="/admin/pilot" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="border-2 border-foreground bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
  return href ? <a href={href} className="hover:opacity-80 transition-opacity">{content}</a> : content;
}
