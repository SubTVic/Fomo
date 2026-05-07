// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Study2Dashboard() {
  const [total, withGroup, recent] = await Promise.all([
    db.study2Session.count(),
    db.study2Session.count({ where: { groupId: { not: null } } }),
    db.study2Session.findMany({
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-heading text-2xl uppercase">Studie 2 — Mitglieder</h1>
        <div className="flex gap-3">
          <Link
            href="/api/admin/study2/export?format=csv"
            className="border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-foreground hover:text-primary-foreground transition-colors"
          >
            CSV Export
          </Link>
          <Link
            href="/api/admin/study2/export?format=json"
            className="border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-foreground hover:text-primary-foreground transition-colors"
          >
            JSON Export
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Stat label="Sessions gesamt" value={total} />
        <Stat
          label="Mit Gruppen-Zuordnung"
          value={`${withGroup} / ${total}`}
        />
      </div>

      <h2 className="font-heading text-lg uppercase mb-3">Letzte 50 Sessions</h2>
      <div className="border-4 border-foreground overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-foreground text-primary-foreground text-left">
            <tr>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Gruppe</th>
              <th className="px-3 py-2">Antworten</th>
              <th className="px-3 py-2">Filter</th>
              <th className="px-3 py-2">Sem.</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Noch keine Sessions.
                </td>
              </tr>
            )}
            {recent.map((s) => {
              const filters = Array.isArray(s.filterSelections)
                ? (s.filterSelections as string[]).join(", ")
                : "";
              const groupLabel =
                s.group?.name ?? (s.groupNameFreeText ? `«${s.groupNameFreeText}»` : "—");
              return (
                <tr key={s.id} className="border-t border-foreground/30">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {s.startedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2">{groupLabel}</td>
                  <td className="px-3 py-2">{s._count.answers}</td>
                  <td className="px-3 py-2 text-muted-foreground">{filters || "—"}</td>
                  <td className="px-3 py-2">{s.semester ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-4 border-foreground bg-card p-4">
      <p className="text-[11px] uppercase tracking-[3px] text-muted-foreground mb-1">
        {label}
      </p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}
