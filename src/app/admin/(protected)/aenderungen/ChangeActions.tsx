// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangeActions({ id, canMarkSeen }: { id: string; canMarkSeen: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "review" | "revert") {
    if (action === "revert" && !window.confirm("Diese Änderung wirklich rückgängig machen?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/changes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Fehler");
        return;
      }
      if (action === "revert" && Array.isArray(data.skipped) && data.skipped.length > 0) {
        setMessage(
          `Zurückgesetzt. ${data.skipped.length} Feld(er) wurden seitdem erneut geändert und blieben unverändert.`,
        );
      }
      router.refresh();
    } catch {
      setMessage("Netzwerkfehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {canMarkSeen && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run("review")}
            className="border-2 border-foreground px-3 py-1 text-xs font-semibold uppercase hover:bg-muted disabled:opacity-50"
          >
            Gesehen
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => run("revert")}
          className="border-2 border-foreground bg-foreground px-3 py-1 text-xs font-semibold uppercase text-background hover:opacity-90 disabled:opacity-50"
        >
          Rückgängig
        </button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
