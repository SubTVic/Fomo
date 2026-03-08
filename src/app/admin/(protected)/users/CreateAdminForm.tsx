// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateAdminForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "EDITOR">("EDITOR");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Erstellen");
        return;
      }

      setEmail("");
      setName("");
      setPassword("");
      setRole("EDITOR");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-foreground text-primary-foreground font-heading uppercase px-4 py-2 text-sm hover:opacity-90 transition-opacity"
      >
        Neuer Admin
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md border-2 border-foreground bg-card p-6">
        <h2 className="mb-4 font-heading text-lg uppercase">Neuen Admin erstellen</h2>

        {error && (
          <p className="mb-4 border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="create-email" className="mb-1 block text-sm font-medium">
              E-Mail *
            </label>
            <input
              id="create-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="create-name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="create-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="create-password" className="mb-1 block text-sm font-medium">
              Passwort * (min. 8 Zeichen)
            </label>
            <input
              id="create-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="create-role" className="mb-1 block text-sm font-medium">
              Rolle *
            </label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "SUPER_ADMIN" | "EDITOR")}
              className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm"
            >
              <option value="EDITOR">Editor</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
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
              {loading ? "Erstelle..." : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
