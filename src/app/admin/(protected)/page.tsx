// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";

export default async function AdminDashboard() {
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
