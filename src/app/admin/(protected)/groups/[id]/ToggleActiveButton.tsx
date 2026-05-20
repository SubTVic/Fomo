// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ToggleActiveButton({
  groupId,
  isActive,
}: {
  groupId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "loading">("idle");

  async function toggle() {
    setState("loading");
    try {
      await fetch(`/api/admin/groups/${groupId}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setState("idle");
    }
  }

  // No warning when deactivating — only when activating
  function handleClick() {
    if (isActive) {
      toggle();
    } else {
      setState("confirm");
    }
  }

  if (state === "confirm") {
    return (
      <div className="flex flex-col gap-2 text-sm max-w-md">
        <p className="text-yellow-900 bg-yellow-50 border-2 border-yellow-400 px-3 py-2">
          ⚠️ Wirklich aktivieren? Prüfe vorher, ob diese Gruppe ein Duplikat ist und zusammengeführt werden muss.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggle}
            className="font-heading uppercase border-2 border-green-600 bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 font-medium"
          >
            Ja, aktivieren
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

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={`font-heading uppercase px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? "border-2 border-red-600 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-2 border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
      }`}
    >
      {state === "loading" ? "..." : isActive ? "Deaktivieren" : "Aktivieren"}
    </button>
  );
}
