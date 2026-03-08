// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";

export function ImportGroupsButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleImport() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/import-groups", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setStatus("done");
        setMessage(json.message ?? "Import abgeschlossen");
      } else {
        setStatus("error");
        setMessage(json.error ?? "Fehler beim Import");
      }
    } catch {
      setStatus("error");
      setMessage("Netzwerkfehler");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span
          className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </span>
      )}
      <button
        onClick={handleImport}
        disabled={status === "loading"}
        className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "Importiere…" : "CSV neu importieren"}
      </button>
    </div>
  );
}
