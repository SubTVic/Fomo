// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScraperImportButton() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ upserted: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setResult(null);
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setError("Ungültige JSON-Datei");
      setImporting(false);
      return;
    }

    const res = await fetch("/api/admin/groups/scraper-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    const data = await res.json();
    setImporting(false);

    if (!res.ok) {
      setError(data.error ?? "Import fehlgeschlagen");
      return;
    }

    setResult({ upserted: data.upserted, skipped: data.skipped });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="text-sm text-muted-foreground">
          ✅ {result.upserted} importiert{result.skipped > 0 ? `, ${result.skipped} Fehler` : ""}
        </span>
      )}
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
      <label className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40 ${importing ? "opacity-50 pointer-events-none" : ""}`}>
        {importing ? "Importiere…" : "↑ Scraper-JSON"}
        <input
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFile}
          disabled={importing}
        />
      </label>
    </div>
  );
}
