// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  overview: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    avgDurationSeconds: number;
    devices: { type: string; count: number }[];
  };
  dropouts: { questionNumber: number | null; count: number }[];
  topGroups: { groupId: string; name: string; count: number; avgScore: number }[];
  perDay: { date: string; started: number; completed: number }[];
  semesters: { tag: string | null; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [semester, setSemester] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function loadData(sem?: string) {
    setLoading(true);
    try {
      const url = sem
        ? `/api/admin/analytics/quiz?semester=${encodeURIComponent(sem)}`
        : "/api/admin/analytics/quiz";
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleSemesterChange(tag: string) {
    setSemester(tag);
    loadData(tag || undefined);
  }

  if (loading && !data) {
    return <div className="mx-auto max-w-4xl p-4">Lade Analytics...</div>;
  }

  if (!data) {
    return <div className="mx-auto max-w-4xl p-4">Fehler beim Laden der Daten.</div>;
  }

  const { overview, dropouts, topGroups, perDay } = data;

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")} min`;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl uppercase">Quiz-Analytics</h1>
        {data.semesters.length > 0 && (
          <select
            value={semester}
            onChange={(e) => handleSemesterChange(e.target.value)}
            className="border-2 border-foreground px-3 py-1 text-sm"
          >
            <option value="">Alle Semester</option>
            {data.semesters.map((s) => (
              <option key={s.tag ?? "null"} value={s.tag ?? ""}>
                {s.tag ?? "Ohne Tag"} ({s.count})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sessions gesamt" value={overview.totalSessions} />
        <StatCard label="Abgeschlossen" value={overview.completedSessions} />
        <StatCard label="Completion-Rate" value={`${overview.completionRate}%`} />
        <StatCard label="Ø Dauer" value={formatDuration(overview.avgDurationSeconds)} />
      </div>

      {/* Devices */}
      {overview.devices.length > 0 && (
        <div className="border-2 border-foreground p-4 bg-card mb-6">
          <h2 className="font-heading text-sm uppercase mb-3">Geräte</h2>
          <div className="flex gap-4">
            {overview.devices.map((d) => (
              <div key={d.type} className="text-sm">
                <span className="text-muted-foreground">{d.type}:</span>{" "}
                <strong>{d.count}</strong>{" "}
                <span className="text-muted-foreground">
                  ({Math.round((d.count / overview.totalSessions) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top matched groups */}
      {topGroups.length > 0 && (
        <div className="border-2 border-foreground p-4 bg-card mb-6">
          <h2 className="font-heading text-sm uppercase mb-3">Top-Match-Gruppen</h2>
          <div className="space-y-2">
            {topGroups.map((g, i) => (
              <div key={g.groupId} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground mr-2">#{i + 1}</span>
                  <strong>{g.name}</strong>
                </div>
                <div className="text-muted-foreground">
                  {g.count}× Top-Match · Ø {g.avgScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropouts */}
      {dropouts.length > 0 && (
        <div className="border-2 border-foreground p-4 bg-card mb-6">
          <h2 className="font-heading text-sm uppercase mb-3">Abbrüche nach Frage</h2>
          <div className="space-y-1">
            {dropouts.map((d) => (
              <div key={d.questionNumber} className="flex items-center gap-2 text-sm">
                <span className="w-20 text-muted-foreground">Frage {d.questionNumber}</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-red-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (d.count / overview.totalSessions) * 100 * 5)}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right">{d.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions per day */}
      {perDay.length > 0 && (
        <div className="border-2 border-foreground p-4 bg-card mb-6">
          <h2 className="font-heading text-sm uppercase mb-3">Sessions pro Tag (letzte 30 Tage)</h2>
          <div className="space-y-1">
            {perDay.map((d) => (
              <div key={d.date} className="flex items-center gap-2 text-sm">
                <span className="w-24 text-muted-foreground">{d.date}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (d.started / Math.max(...perDay.map((p) => p.started), 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-20 text-right text-muted-foreground">
                  {d.started} / {d.completed}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview.totalSessions === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-lg mb-2">Noch keine Quiz-Sessions</p>
          <p className="text-sm">Daten erscheinen hier sobald Nutzende das Quiz abschließen.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-foreground p-4 bg-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
