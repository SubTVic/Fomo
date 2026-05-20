// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MergeButtonProps {
  sourceGroupId: string;
  sourceGroupName: string;
  targetGroupId: string;
  targetGroupName: string;
}

export function MergeButton({ sourceGroupId, sourceGroupName, targetGroupId, targetGroupName }: MergeButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "choose" | "confirm" | "loading" | "error">("idle");
  // keepSourceData=true → source (this page) data wins; false → target (existing) data wins
  const [keepSourceData, setKeepSourceData] = useState(true);
  const [error, setError] = useState("");

  async function handleMerge() {
    setState("loading");
    try {
      const res = await fetch(`/api/admin/groups/${sourceGroupId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroupId, keepSourceData }),
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

  if (state === "choose") {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <span className="font-medium text-foreground">Welche Daten behalten?</span>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="keepData"
              checked={keepSourceData}
              onChange={() => setKeepSourceData(true)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Diese Gruppe ({sourceGroupName})</span>
              <span className="text-muted-foreground"> — neu eingereichte Daten überschreiben die alte Einträge</span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="keepData"
              checked={!keepSourceData}
              onChange={() => setKeepSourceData(false)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Bestehende Gruppe ({targetGroupName})</span>
              <span className="text-muted-foreground"> — nur fehlende Felder aus dieser Gruppe ergänzen</span>
            </span>
          </label>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setState("confirm")}
            className="border-2 border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-1.5 font-medium transition-colors"
          >
            Weiter →
          </button>
          <button
            onClick={() => setState("idle")}
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  if (state === "confirm") {
    const deletedName = sourceGroupName;
    const survivingName = targetGroupName;
    const dataFrom = keepSourceData ? sourceGroupName : targetGroupName;
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-red-700">{deletedName}</span> wird gelöscht.{" "}
          <span className="font-medium text-foreground">{survivingName}</span> bleibt mit den Daten von{" "}
          <span className="font-medium">{dataFrom}</span>.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMerge}
            className="border-2 border-red-600 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-1.5 font-medium transition-colors"
          >
            Ja, zusammenführen
          </button>
          <button
            onClick={() => setState("choose")}
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Zurück
          </button>
        </div>
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
      onClick={() => setState("choose")}
      className="border-2 border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-1.5 text-sm font-medium transition-colors"
    >
      Mit &bdquo;{targetGroupName}&ldquo; zusammenführen →
    </button>
  );
}
