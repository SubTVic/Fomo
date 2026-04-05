// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useEffect, useState } from "react";

interface SemesterArchive {
  id: string;
  tag: string;
  startDate: string;
  endDate: string;
  groupCount: number;
  sessionCount: number;
  completionRate: number;
  createdAt: string;
}

export default function SemestersPage() {
  const [currentSemester, setCurrentSemester] = useState<string | null>(null);
  const [archives, setArchives] = useState<SemesterArchive[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/semesters/archive");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setCurrentSemester(data.currentSemester);
      setArchives(data.archives);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleArchive() {
    if (!newTag.trim()) {
      setError("Bitte neuen Semester-Tag eingeben (z.B. WS27/28)");
      return;
    }
    if (!confirm(`Semester "${currentSemester ?? "Unbekannt"}" wirklich abschließen und "${newTag}" starten?`)) {
      return;
    }

    setArchiving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/semesters/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSemesterTag: newTag.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler beim Archivieren");
      }

      setSuccess(`Semester "${currentSemester}" archiviert. Neues Semester: "${newTag}"`);
      setNewTag("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl p-4">Lade Semester-Daten...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl uppercase mb-6">Semester-Verwaltung</h1>

      {/* Current semester */}
      <div className="border-4 border-foreground p-6 bg-card mb-6">
        <h2 className="font-heading text-lg uppercase mb-2">Aktuelles Semester</h2>
        <p className="text-3xl font-bold mb-4">
          {currentSemester ?? <span className="text-muted-foreground">Nicht gesetzt</span>}
        </p>

        <div className="border-t-2 border-foreground/20 pt-4 mt-4">
          <h3 className="font-semibold mb-2">Semester abschließen & neues starten</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Dies archiviert alle Statistiken, setzt den Semester-Tag und markiert alle Gruppen als &quot;eingeladen&quot; (zur erneuten Bestätigung).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Neuer Tag, z.B. WS27/28"
              className="border-2 border-foreground px-3 py-2 text-sm flex-1"
            />
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="bg-foreground text-background px-4 py-2 text-sm font-semibold uppercase hover:opacity-90 disabled:opacity-50"
            >
              {archiving ? "Archiviere..." : "Semester abschließen"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-2 border-red-500 bg-red-50 text-red-700 p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="border-2 border-green-500 bg-green-50 text-green-700 p-3 mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Archive list */}
      <h2 className="font-heading text-lg uppercase mb-4">Archiv</h2>

      {archives.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch keine Semester archiviert.</p>
      ) : (
        <div className="space-y-3">
          {archives.map((a) => (
            <div key={a.id} className="border-2 border-foreground p-4 bg-card">
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="font-heading text-lg">{a.tag}</h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Gruppen:</span>{" "}
                  <strong>{a.groupCount}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Sessions:</span>{" "}
                  <strong>{a.sessionCount}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Completion:</span>{" "}
                  <strong>{Math.round(a.completionRate * 100)}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
