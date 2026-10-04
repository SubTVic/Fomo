// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  /** API endpoint that handles DELETE. */
  url: string;
  /** Accessible name, e.g. "Gruppe X löschen". */
  title: string;
}

/** "Löschen" with an inline "Sicher? Ja/Nein" confirmation. */
export function DeleteButton({ url, title }: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleDelete() {
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(url, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
        setConfirming(false);
      } else {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Löschen");
        setStatus("error");
      }
    } catch {
      setError("Netzwerkfehler");
      setStatus("error");
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={title}
      >
        Löschen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-destructive">Sicher?</span>
      <button
        onClick={handleDelete}
        disabled={status === "loading"}
        className="rounded border bg-destructive text-destructive-foreground px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {status === "loading" ? "…" : "Ja"}
      </button>
      <button
        onClick={() => { setConfirming(false); setError(""); }}
        className="rounded border px-2 py-1 text-xs hover:bg-muted/40"
      >
        Nein
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
