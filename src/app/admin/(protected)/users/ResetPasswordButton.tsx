// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetPasswordButton({
  adminId,
  adminName,
}: {
  adminId: string;
  adminName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${adminId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Zurücksetzen");
        return;
      }

      setPassword("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="Passwort zurücksetzen"
      >
        Passwort
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md border-2 border-foreground bg-card p-6">
            <h2 className="mb-2 font-heading text-lg uppercase">Passwort zurücksetzen</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Neues Passwort für <strong>{adminName}</strong>
            </p>

            {error && (
              <p className="mb-4 border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`reset-pw-${adminId}`} className="mb-1 block text-sm font-medium">
                  Neues Passwort * (min. 8 Zeichen)
                </label>
                <input
                  id={`reset-pw-${adminId}`}
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError(null);
                    setPassword("");
                  }}
                  className="border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-muted transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-foreground text-primary-foreground font-heading uppercase px-4 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Setze zurück..." : "Zurücksetzen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
