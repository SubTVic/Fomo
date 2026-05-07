// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MergeButtonProps {
  sourceGroupId: string;
  targetGroupId: string;
  targetGroupName: string;
}

export function MergeButton({ sourceGroupId, targetGroupId, targetGroupName }: MergeButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleMerge() {
    setState("loading");
    try {
      const res = await fetch(`/api/admin/groups/${sourceGroupId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroupId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/admin/groups/${targetGroupId}`);
        router.refresh();
      } else {
        setError(data.error ?? "Fehler beim Zusammenführen");
        setState("error");
      }
    } catch {
      setError("Netzwerkfehler");
      setState("error");
    }
  }

  if (state === "confirm") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          Wirklich zusammenführen? Diese Gruppe wird gelöscht.
        </span>
        <button
          onClick={handleMerge}
          className="border-2 border-red-600 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-1.5 text-sm font-medium transition-colors"
        >
          Ja, zusammenführen
        </button>
        <button
          onClick={() => setState("idle")}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Abbrechen
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return <span className="text-sm text-muted-foreground">Wird zusammengeführt…</span>;
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">{error}</span>
        <button onClick={() => setState("idle")} className="text-sm underline">Zurück</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState("confirm")}
      className="border-2 border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-1.5 text-sm font-medium transition-colors"
    >
      Mit &bdquo;{targetGroupName}&ldquo; zusammenführen →
    </button>
  );
}
