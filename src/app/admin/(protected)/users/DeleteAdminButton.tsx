// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAdminButton({
  adminId,
  adminName,
  isSelf,
}: {
  adminId: string;
  adminName: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${adminId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Löschen");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  if (isSelf) {
    return (
      <span
        className="text-sm text-muted-foreground/40 cursor-not-allowed"
        title="Du kannst dich nicht selbst löschen"
      >
        Löschen
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:text-red-800 transition-colors"
        title="Löschen"
      >
        Löschen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md border-2 border-foreground bg-card p-6">
            <h2 className="mb-2 font-heading text-lg uppercase">Admin löschen</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Soll <strong>{adminName}</strong> wirklich gelöscht werden? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </p>

            {error && (
              <p className="mb-4 border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white font-heading uppercase px-4 py-2 text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Lösche..." : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
