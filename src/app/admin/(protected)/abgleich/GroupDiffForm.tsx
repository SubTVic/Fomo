// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GroupDiff } from "@/lib/website-sync";

function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

/** One group's differences with a checkbox per field (all off by default). */
export function GroupDiffForm({ group }: { group: GroupDiff }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function toggle(key: string) {
    setPicked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function apply() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/website-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.groupId, keys: picked }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: `${data.applied?.length ?? picked.length} Feld(er) übernommen.` });
        setPicked([]);
        router.refresh();
      } else {
        setMessage({ ok: false, text: data.error ?? "Fehler beim Übernehmen." });
      }
    } catch {
      setMessage({ ok: false, text: "Netzwerkfehler." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-2 border-foreground bg-background p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/admin/groups/${group.groupId}`} className="font-semibold hover:underline">
          {group.name}
        </Link>
        <span className="text-xs text-muted-foreground">{group.slug}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-foreground/20">
              <th className="py-1 pr-2">Übernehmen</th>
              <th className="py-1 pr-2">Feld</th>
              <th className="py-1 pr-2">Datenbank</th>
              <th className="py-1">Website</th>
            </tr>
          </thead>
          <tbody>
            {group.diffs.map((d) => (
              <tr key={d.key} className="border-b border-foreground/10 align-top">
                <td className="py-1.5 pr-2">
                  <input
                    type="checkbox"
                    aria-label={`${d.label} von der Website übernehmen`}
                    checked={picked.includes(d.key)}
                    onChange={() => toggle(d.key)}
                  />
                </td>
                <td className="py-1.5 pr-2 font-medium">{d.label}</td>
                <td className="max-w-xs break-words py-1.5 pr-2 text-muted-foreground">{show(d.inDb)}</td>
                <td className="max-w-xs break-words py-1.5">{show(d.onWebsite)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPicked(picked.length === group.diffs.length ? [] : group.diffs.map((d) => d.key))}
          className="text-xs underline underline-offset-2"
        >
          {picked.length === group.diffs.length ? "Keine auswählen" : "Alle auswählen"}
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={busy || picked.length === 0}
          className="bg-foreground px-4 py-2 font-heading text-xs uppercase tracking-wider text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Übernehme …" : `Website-Werte übernehmen (${picked.length})`}
        </button>
        {message && (
          <span className={`text-xs ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</span>
        )}
      </div>
    </div>
  );
}
