// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface CreateGroupFormProps {
  categories: Category[];
}

export function CreateGroupForm({ categories }: CreateGroupFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      shortDescription: form.get("shortDescription") as string,
      categoryId: form.get("categoryId") as string,
      contactEmail: form.get("contactEmail") as string,
      websiteUrl: form.get("websiteUrl") as string,
    };

    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        router.push(`/admin/groups/${data.group.id}`);
      } else {
        setError(data.error ?? "Fehler beim Erstellen");
        setStatus("error");
      }
    } catch {
      setError("Netzwerkfehler");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          name="name"
          required
          className="w-full rounded border-2 border-foreground px-3 py-2 bg-background"
          placeholder="z.B. AEGEE Dresden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kurzbeschreibung *</label>
        <input
          name="shortDescription"
          required
          maxLength={200}
          className="w-full rounded border-2 border-foreground px-3 py-2 bg-background"
          placeholder="Was macht die Gruppe?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kategorie *</label>
        <select
          name="categoryId"
          required
          className="w-full rounded border-2 border-foreground px-3 py-2 bg-background"
        >
          <option value="">Bitte wählen…</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kontakt-E-Mail</label>
        <input
          name="contactEmail"
          type="email"
          className="w-full rounded border-2 border-foreground px-3 py-2 bg-background"
          placeholder="kontakt@gruppe.de"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Website</label>
        <input
          name="websiteUrl"
          type="url"
          className="w-full rounded border-2 border-foreground px-3 py-2 bg-background"
          placeholder="https://..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded border-2 border-foreground bg-primary text-primary-foreground px-6 py-2 font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "Erstelle…" : "Gruppe anlegen"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border-2 border-foreground px-6 py-2 font-medium hover:bg-muted/40 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
