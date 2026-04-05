// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const [
    groupCount,
    pendingSubmissions,
    pilotCount,
    quizSessionsTotal,
    quizSessionsToday,
    currentSemester,
  ] = await Promise.all([
    db.group.count({ where: { isActive: true } }),
    db.group.count({ where: { registrationStatus: "submitted" } }),
    db.pilotSession.count({ where: { completedAt: { not: null } } }),
    db.quizSession.count({ where: { completedAt: { not: null } } }),
    db.quizSession.count({
      where: {
        completedAt: { not: null },
        startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    db.siteConfig.findUnique({ where: { key: "current_semester" } }).catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl uppercase">Dashboard</h1>
        {currentSemester?.value && (
          <span className="border-2 border-foreground px-3 py-1 text-sm font-semibold">
            {currentSemester.value}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Aktive Gruppen" value={groupCount} href="/admin/groups" />
        <StatCard label="Offene Einreichungen" value={pendingSubmissions} href="/admin/groups" highlight={pendingSubmissions > 0} />
        <StatCard label="Quiz-Completions (heute)" value={quizSessionsToday} href="/admin/analytics" />
        <StatCard label="Quiz-Completions (gesamt)" value={quizSessionsTotal} href="/admin/analytics" />
      </div>

      {/* Pilot (will be removed after pilot phase) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Pilot-Sessions" value={pilotCount} href="/admin/pilot" />
      </div>

      {/* Quick actions */}
      <h2 className="font-heading text-lg uppercase mb-4">Quick-Actions</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction href="/admin/quiz" label="Thesen verwalten" />
        <QuickAction href="/admin/groups" label="Einladungen generieren" />
        <QuickAction href="/admin/semesters" label="Semester abschließen" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className={`border-2 border-foreground bg-card p-6 ${highlight ? "border-yellow-500 bg-yellow-50" : ""}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
  return href ? <a href={href} className="hover:opacity-80 transition-opacity">{content}</a> : content;
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border-2 border-foreground px-4 py-3 text-sm font-semibold uppercase text-center hover:bg-foreground hover:text-background transition-colors"
    >
      {label}
    </Link>
  );
}
