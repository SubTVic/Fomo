// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PilotStatisticsResponse, ItemStats, DimensionStats } from "@/types/pilot-statistics";
import { getAlphaColor } from "@/lib/pilot-statistics";

// ── Types ─────────────────────────────────────────────────────────

interface SerializedSession {
  id: string;
  startedAt: string;
  completedAt: string | null;
  variant: string;
  preferredVariant: string | null;
  semester: string | null;
  answerCount: number;
}

interface SerializedFeedback {
  id: string;
  startedAt: string;
  variant: string;
  confusing: string | null;
  missing: string | null;
}

interface Props {
  stats: PilotStatisticsResponse;
  recentSessions: SerializedSession[];
  feedback: SerializedFeedback[];
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_DOTS: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

const STATUS_ORDER: Record<string, number> = { red: 0, yellow: 1, gray: 2, green: 3 };

const VARIANT_LABELS: Record<string, string> = {
  scroll: "Scroll",
  classic: "Classic",
  swipe: "Swipe",
  chat: "Chat",
};

function pct(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

function formatDuration(isoStart: string, isoEnd: string): string {
  const ms = new Date(isoEnd).getTime() - new Date(isoStart).getTime();
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// ── Main Component ────────────────────────────────────────────────

export function PilotDashboardClient({ stats, recentSessions, feedback }: Props) {
  const [sortCol, setSortCol] = useState<string>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterDim, setFilterDim] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Demographic filter state
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filteredStats, setFilteredStats] = useState<PilotStatisticsResponse | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const isFiltered = filterSemester !== "all" || filterMember !== "all";
  const activeStats = filteredStats && isFiltered ? filteredStats : stats;

  const fetchFilteredStats = useCallback(async (semester: string, member: string) => {
    if (semester === "all" && member === "all") {
      setFilteredStats(null);
      return;
    }
    setFilterLoading(true);
    try {
      const params = new URLSearchParams();
      if (semester !== "all") params.set("semester", semester);
      if (member !== "all") params.set("isMember", member);
      const res = await fetch(`/api/admin/pilot/statistics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFilteredStats(data);
      }
    } catch {
      // Silently fail, keep unfiltered data
    } finally {
      setFilterLoading(false);
    }
  }, []);

  // Bulk delete state
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === recentSessions.length
        ? new Set()
        : new Set(recentSessions.map((s) => s.id)),
    );
  }, [recentSessions]);

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/pilot/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Fehler beim Loeschen");
      }
    } catch {
      alert("Netzwerkfehler");
    } finally {
      setBulkDeleting(false);
    }
  }

  const { overview, demographics, items, dimensions, redundancies } = activeStats;

  // ── Sorted & Filtered Items ─────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterDim === "standalone") {
      result = result.filter((i) => i.isStandalone);
    } else if (filterDim !== "all") {
      result = result.filter((i) => i.dimensionId === filterDim);
    }

    if (filterStatus !== "all") {
      result = result.filter((i) => i.status === filterStatus);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) => i.questionText.toLowerCase().includes(q) || i.questionId.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          if (cmp === 0) cmp = (a.rit ?? -1) - (b.rit ?? -1);
          break;
        case "id":
          cmp = a.questionId.localeCompare(b.questionId);
          break;
        case "n":
          cmp = a.n - b.n;
          break;
        case "mean":
          cmp = (a.mean ?? 0) - (b.mean ?? 0);
          break;
        case "sd":
          cmp = (a.sd ?? 0) - (b.sd ?? 0);
          break;
        case "rit":
          cmp = (a.rit ?? -1) - (b.rit ?? -1);
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, filterDim, filterStatus, search, sortCol, sortDir]);

  function toggleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const sortArrow = (col: string) =>
    sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  // Sorted dimensions by alpha ascending
  const sortedDimensions = useMemo(
    () => [...dimensions].sort((a, b) => (a.alpha ?? -1) - (b.alpha ?? -1)),
    [dimensions],
  );

  // Unique dimension list for filter
  const dimOptions = useMemo(() => {
    const dims = items
      .filter((i) => i.dimensionId)
      .map((i) => ({ id: i.dimensionId!, label: i.dimensionLabel ?? i.dimensionId!, emoji: i.dimensionEmoji ?? "" }));
    const unique = new Map(dims.map((d) => [d.id, d]));
    return Array.from(unique.values());
  }, [items]);

  // Item statistics CSV export
  function exportItemCsv() {
    const header = "question_id,dimension,is_standalone,is_inverse,n,mean,sd,rit,status\n";
    const rows = items.map((i) =>
      [
        i.questionId,
        i.dimensionId ?? "",
        i.isStandalone,
        i.isInverse,
        i.n,
        i.mean?.toFixed(2) ?? "",
        i.sd?.toFixed(2) ?? "",
        i.rit?.toFixed(2) ?? "",
        i.status,
      ].join(","),
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilot-item-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {/* ── Overview Cards ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Gesamt" value={overview.totalSessions} />
        <StatCard label="Abgeschlossen" value={overview.completedSessions} />
        <StatCard label="Abschlussrate" value={`${overview.completionRate}%`} />
        <StatCard label="Ø Dauer" value={`${overview.avgDurationMinutes} min`} />
        <StatCard label="Ø Fragen" value={overview.avgQuestionsAnswered} />
      </div>

      {/* ── Demographic Filter ────────────────────────────────── */}
      <div className="border-2 border-foreground bg-card px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-heading uppercase">Filter:</span>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Semester</span>
            <select
              value={filterSemester}
              onChange={(e) => {
                setFilterSemester(e.target.value);
                fetchFilteredStats(e.target.value, filterMember);
              }}
              className="border-2 border-foreground bg-background px-2 py-1 text-sm"
            >
              <option value="all">Alle</option>
              {Object.keys(stats.demographics.semester)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((s) => (
                  <option key={s} value={s}>
                    {s}. Semester ({stats.demographics.semester[s]})
                  </option>
                ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Mitglied</span>
            <select
              value={filterMember}
              onChange={(e) => {
                setFilterMember(e.target.value);
                fetchFilteredStats(filterSemester, e.target.value);
              }}
              className="border-2 border-foreground bg-background px-2 py-1 text-sm"
            >
              <option value="all">Alle</option>
              <option value="yes">Ja ({stats.demographics.membership["yes"] ?? 0})</option>
              <option value="no">Nein ({stats.demographics.membership["no"] ?? 0})</option>
              <option value="was">War Mitglied ({stats.demographics.membership["was"] ?? 0})</option>
            </select>
          </label>
          {isFiltered && (
            <button
              onClick={() => {
                setFilterSemester("all");
                setFilterMember("all");
                setFilteredStats(null);
              }}
              className="border-2 border-foreground px-3 py-1 text-xs font-heading uppercase hover:bg-muted transition-colors"
            >
              Filter zuruecksetzen
            </button>
          )}
          {filterLoading && (
            <span className="text-xs text-muted-foreground">Lade...</span>
          )}
          {isFiltered && !filterLoading && (
            <span className="text-xs text-muted-foreground">
              {overview.completedSessions} von {stats.overview.completedSessions} Sessions
            </span>
          )}
        </div>
      </div>

      {/* ── Demographics ───────────────────────────────────────── */}
      <details className="border-2 border-foreground bg-card">
        <summary className="px-6 py-4 font-heading text-lg uppercase cursor-pointer hover:bg-muted/20">
          Demografie & Varianten
        </summary>
        <div className="px-6 pb-6 grid gap-6 sm:grid-cols-3">
          <BarChart title="Semester" data={demographics.semester} />
          <BarChart
            title="Mitgliedschaft"
            data={demographics.membership}
            labels={{ yes: "Ja", no: "Nein", was: "War Mitglied" }}
          />
          <BarChart
            title="Bevorzugte Variante"
            data={demographics.preferredVariant}
            labels={VARIANT_LABELS}
          />
        </div>
      </details>

      {/* ── Dimension Overview ─────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-heading text-xl uppercase">Dimensionen</h2>
        {sortedDimensions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Dimensionen vorhanden.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedDimensions.map((dim) => (
              <DimensionCard key={dim.dimensionId} dim={dim} />
            ))}
          </div>
        )}
      </section>

      {/* ── Item Statistics Table ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h2 className="font-heading text-xl uppercase">Item-Statistik</h2>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterDim}
              onChange={(e) => setFilterDim(e.target.value)}
              className="border px-2 py-1.5 text-sm"
            >
              <option value="all">Alle Dimensionen</option>
              {dimOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.id}
                </option>
              ))}
              <option value="standalone">Standalone</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border px-2 py-1.5 text-sm"
            >
              <option value="all">Alle Status</option>
              <option value="red">Rot</option>
              <option value="yellow">Gelb</option>
              <option value="green">Grün</option>
              <option value="gray">Grau</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche..."
              className="border px-2 py-1.5 text-sm w-40"
            />
            <button
              onClick={exportItemCsv}
              className="border-2 border-foreground px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-foreground">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground bg-muted">
                <Th onClick={() => toggleSort("status")}>
                  St.{sortArrow("status")}
                </Th>
                <Th onClick={() => toggleSort("id")}>
                  ID{sortArrow("id")}
                </Th>
                <Th>Dim</Th>
                <Th>Frage</Th>
                <Th onClick={() => toggleSort("n")} align="right">
                  n{sortArrow("n")}
                </Th>
                <Th onClick={() => toggleSort("mean")} align="right">
                  M{sortArrow("mean")}
                </Th>
                <Th onClick={() => toggleSort("sd")} align="right">
                  SD{sortArrow("sd")}
                </Th>
                <Th>Verteilung</Th>
                <Th onClick={() => toggleSort("rit")} align="right">
                  r_it{sortArrow("rit")}
                </Th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-muted-foreground">
                    Keine Fragen gefunden.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <ItemRow
                    key={item.questionId}
                    item={item}
                    isExpanded={expandedItem === item.questionId}
                    onToggle={() => setExpandedItem(expandedItem === item.questionId ? null : item.questionId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filteredItems.length} von {items.length} Fragen
        </p>
      </section>

      {/* ── Redundancy Table ───────────────────────────────────── */}
      {redundancies.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-xl uppercase">Redundanz</h2>
          <div className="overflow-x-auto border-2 border-foreground">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-foreground bg-muted">
                  <th className="px-3 py-2 text-left font-medium">Frage A</th>
                  <th className="px-3 py-2 text-left font-medium">Frage B</th>
                  <th className="px-3 py-2 text-right font-medium">r</th>
                  <th className="px-3 py-2 text-center font-medium">Flag</th>
                </tr>
              </thead>
              <tbody>
                {redundancies.map((pair, i) => (
                  <tr
                    key={i}
                    className="border-b border-foreground/20 last:border-b-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{pair.questionA}</td>
                    <td className="px-3 py-2 font-mono text-xs">{pair.questionB}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pair.correlation.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          pair.flag === "redundant"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {pair.flag === "redundant" ? "Redundant" : "Prüfen"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Recent Sessions ────────────────────────────────────── */}
      <details className="border-2 border-foreground bg-card">
        <summary className="px-6 py-4 font-heading text-lg uppercase cursor-pointer hover:bg-muted/20">
          Letzte Sessions ({recentSessions.length})
        </summary>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 border-b-2 border-foreground bg-red-50 px-4 py-3">
            <span className="text-sm font-medium">
              {selected.size} ausgewaehlt
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="border-2 border-foreground px-3 py-1.5 text-xs font-heading uppercase hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
              {bulkDeleting ? (
                <button
                  disabled
                  className="bg-red-600 px-3 py-1.5 text-xs font-heading uppercase text-white opacity-50"
                >
                  Wird geloescht...
                </button>
              ) : (
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 px-3 py-1.5 text-xs font-heading uppercase text-white hover:bg-red-700 transition-colors"
                >
                  {selected.size} loeschen
                </button>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground bg-muted">
                <th className="w-10 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={recentSessions.length > 0 && selected.size === recentSessions.length}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-foreground"
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium">Datum</th>
                <th className="px-3 py-2 text-left font-medium">Variante</th>
                <th className="px-3 py-2 text-left font-medium">Praeferenz</th>
                <th className="px-3 py-2 text-left font-medium">Semester</th>
                <th className="px-3 py-2 text-right font-medium">Dauer</th>
                <th className="px-3 py-2 text-right font-medium">Antworten</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-foreground/20 last:border-b-0 hover:bg-muted/30 ${selected.has(s.id) ? "bg-red-50" : ""}`}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 accent-foreground"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    <Link href={`/admin/pilot/${s.id}`} className="hover:underline">
                      {new Date(s.startedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{s.variant}</td>
                  <td className="px-3 py-2">
                    {s.preferredVariant ? (VARIANT_LABELS[s.preferredVariant] ?? s.preferredVariant) : "–"}
                  </td>
                  <td className="px-3 py-2">{s.semester ?? "–"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {s.completedAt ? formatDuration(s.startedAt, s.completedAt) : "–"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.answerCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* ── Feedback ───────────────────────────────────────────── */}
      {feedback.length > 0 && (
        <details className="border-2 border-foreground bg-card">
          <summary className="px-6 py-4 font-heading text-lg uppercase cursor-pointer hover:bg-muted/20">
            Offenes Feedback ({feedback.length})
          </summary>
          <div className="px-6 pb-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm text-muted-foreground">Was war verwirrend?</p>
              <ul className="space-y-3">
                {feedback.filter((f) => f.confusing?.trim()).map((f) => (
                  <li key={`c-${f.id}`} className="border-l-2 border-foreground/30 pl-3 text-sm">
                    <p>{f.confusing}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(f.startedAt).toLocaleDateString("de-DE")} · {f.variant}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm text-muted-foreground">Was hat gefehlt?</p>
              <ul className="space-y-3">
                {feedback.filter((f) => f.missing?.trim()).map((f) => (
                  <li key={`m-${f.id}`} className="border-l-2 border-foreground/30 pl-3 text-sm">
                    <p>{f.missing}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(f.startedAt).toLocaleDateString("de-DE")} · {f.variant}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-2 border-foreground bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function BarChart({
  title,
  data,
  labels,
}: {
  title: string;
  data: Record<string, number>;
  labels?: Record<string, string>;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">{title}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Daten.</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map(([key, count]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span>{labels?.[key] ?? key}</span>
                <span className="tabular-nums">{count} ({pct(count, total)})</span>
              </div>
              <div className="h-4 bg-muted border border-foreground/20">
                <div
                  className="h-full bg-foreground/70 transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DimensionCard({ dim }: { dim: DimensionStats }) {
  const alphaColor = getAlphaColor(dim.alpha);
  const colorClasses: Record<string, string> = {
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    gray: "bg-muted text-muted-foreground",
  };

  return (
    <div className="border-2 border-foreground bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{dim.emoji}</span>
        <span className="font-heading text-sm uppercase">{dim.dimensionId}</span>
        <span className="font-medium text-sm">{dim.label}</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses[alphaColor]}`}>
          α = {dim.alpha !== null ? dim.alpha.toFixed(2) : "–"}
        </span>
        <span className="text-xs text-muted-foreground">{dim.alphaRating}</span>
      </div>

      {dim.weakestItem && (
        <p className="text-xs text-muted-foreground">
          Schwächstes Item: <span className="font-mono">{dim.weakestItem.id}</span> (r_it = {dim.weakestItem.rit.toFixed(2)})
        </p>
      )}

      {dim.bestAlphaIfDeleted && (
        <p className="text-xs text-amber-700">
          α steigt auf {dim.bestAlphaIfDeleted.alpha.toFixed(2)} ohne {dim.bestAlphaIfDeleted.itemId}
        </p>
      )}

      <div className="mt-2 flex gap-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {dim.statusCounts.green}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          {dim.statusCounts.yellow}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {dim.statusCounts.red}
        </span>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  align = "left",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 font-medium whitespace-nowrap ${align === "right" ? "text-right" : "text-left"} ${onClick ? "cursor-pointer hover:bg-muted/50 select-none" : ""}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}

function ItemRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: ItemStats;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const total = item.distribution["1"] + item.distribution["3"] + item.distribution["5"];

  return (
    <>
      <tr
        className="border-b border-foreground/20 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-3 py-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_DOTS[item.status]}`} />
        </td>
        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
          {item.questionId}
          {item.isInverse && (
            <span className="ml-1 text-amber-600" title="Inverses Item">R</span>
          )}
        </td>
        <td className="px-3 py-2 text-xs whitespace-nowrap">
          {item.isStandalone ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span>{item.dimensionEmoji} {item.dimensionId}</span>
          )}
        </td>
        <td className="px-3 py-2 text-sm max-w-xs truncate" title={item.questionText}>
          {item.questionText}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{item.n}</td>
        <td className="px-3 py-2 text-right tabular-nums">
          {item.mean !== null ? item.mean.toFixed(1) : "–"}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          {item.sd !== null ? item.sd.toFixed(2) : "–"}
        </td>
        <td className="px-3 py-2">
          {total > 0 ? (
            <DistributionBar dist={item.distribution} total={total} />
          ) : (
            <span className="text-xs text-muted-foreground">–</span>
          )}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          {item.rit !== null ? item.rit.toFixed(2) : "–"}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/10">
          <td colSpan={9} className="px-6 py-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">{item.questionText}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">n:</span> {item.n}
                </div>
                <div>
                  <span className="text-muted-foreground">Mittelwert:</span>{" "}
                  {item.mean !== null ? item.mean.toFixed(2) : "–"}
                </div>
                <div>
                  <span className="text-muted-foreground">SD:</span>{" "}
                  {item.sd !== null ? item.sd.toFixed(2) : "–"}
                </div>
                <div>
                  <span className="text-muted-foreground">Missing-Rate:</span>{" "}
                  {(item.missingRate * 100).toFixed(1)}%
                </div>
                {item.rit !== null && (
                  <div>
                    <span className="text-muted-foreground">r_it:</span>{" "}
                    {item.rit.toFixed(3)}
                  </div>
                )}
                {item.isInverse && (
                  <div>
                    <span className="text-amber-600 font-medium">Inverses Item</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4 text-xs">
                <span>
                  <span className="inline-block w-3 h-3 bg-red-400 rounded mr-1 align-middle" />
                  Nein: {item.distribution["1"]} ({total > 0 ? pct(item.distribution["1"], total) : "0%"})
                </span>
                <span>
                  <span className="inline-block w-3 h-3 bg-gray-400 rounded mr-1 align-middle" />
                  Egal: {item.distribution["3"]} ({total > 0 ? pct(item.distribution["3"], total) : "0%"})
                </span>
                <span>
                  <span className="inline-block w-3 h-3 bg-green-400 rounded mr-1 align-middle" />
                  Ja: {item.distribution["5"]} ({total > 0 ? pct(item.distribution["5"], total) : "0%"})
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DistributionBar({ dist, total }: { dist: { "1": number; "3": number; "5": number }; total: number }) {
  const p1 = (dist["1"] / total) * 100;
  const p3 = (dist["3"] / total) * 100;
  const p5 = (dist["5"] / total) * 100;

  return (
    <div className="flex h-4 w-24 overflow-hidden rounded-sm border border-foreground/20" title={`Nein: ${dist["1"]}, Egal: ${dist["3"]}, Ja: ${dist["5"]}`}>
      {p1 > 0 && <div className="bg-red-400" style={{ width: `${p1}%` }} />}
      {p3 > 0 && <div className="bg-gray-400" style={{ width: `${p3}%` }} />}
      {p5 > 0 && <div className="bg-green-400" style={{ width: `${p5}%` }} />}
    </div>
  );
}
