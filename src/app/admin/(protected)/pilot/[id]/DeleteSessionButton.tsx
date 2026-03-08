// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/pilot/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/pilot");
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Fehler beim Loeschen");
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      alert("Netzwerkfehler");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="border-2 border-red-500 px-4 py-2 text-sm font-heading uppercase text-red-600 hover:bg-red-50 transition-colors"
      >
        Session loeschen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-red-600">Wirklich loeschen?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="bg-red-600 px-4 py-2 text-sm font-heading uppercase text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {deleting ? "Wird geloescht..." : "Ja, loeschen"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-muted transition-colors"
      >
        Abbrechen
      </button>
    </div>
  );
}
