// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
}

export function EditAdminButton({ admin }: { admin: AdminData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(admin.name ?? "");
  const [email, setEmail] = useState(admin.email);
  const [role, setRole] = useState(admin.role);
  const [isActive, setIsActive] = useState(admin.isActive);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          email,
          role,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Aktualisieren");
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="Bearbeiten"
      >
        Bearbeiten
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md border-2 border-foreground bg-card p-6">
            <h2 className="mb-4 font-heading text-lg uppercase">Admin bearbeiten</h2>

            {error && (
              <p className="mb-4 border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`edit-name-${admin.id}`} className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <input
                  id={`edit-name-${admin.id}`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor={`edit-email-${admin.id}`} className="mb-1 block text-sm font-medium">
                  E-Mail
                </label>
                <input
                  id={`edit-email-${admin.id}`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor={`edit-role-${admin.id}`} className="mb-1 block text-sm font-medium">
                  Rolle
                </label>
                <select
                  id={`edit-role-${admin.id}`}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`edit-active-${admin.id}`}
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor={`edit-active-${admin.id}`} className="text-sm font-medium">
                  Aktiv
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError(null);
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
                  {loading ? "Speichere..." : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
