// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InviteButtonProps {
  groupId: string;
  groupName: string;
  contactEmail: string | null;
}

export function InviteButton({ groupId, groupName, contactEmail }: InviteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(contactEmail ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ token: string; link: string } | null>(null);
  const [error, setError] = useState("");

  async function handleInvite() {
    if (!email) return;
    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/groups/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invites: [{ groupId, email, expiresInDays: 30 }],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const inv = data.invites[0];
        const link = `${window.location.origin}/groups/register?token=${inv.token}`;
        setResult({ token: inv.token, link });
        setStatus("done");
        router.refresh();
      } else {
        setError(data.error ?? "Fehler beim Generieren");
        setStatus("error");
      }
    } catch {
      setError("Netzwerkfehler");
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
        title={`Einladung für ${groupName}`}
      >
        Einladen
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[220px]">
      <div className="flex gap-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          className="w-full rounded border px-2 py-1 text-xs bg-background"
        />
        <button
          onClick={handleInvite}
          disabled={status === "loading" || !email}
          className="rounded border bg-primary text-primary-foreground px-2 py-1 text-xs font-medium whitespace-nowrap disabled:opacity-50"
        >
          {status === "loading" ? "…" : "Senden"}
        </button>
        <button
          onClick={() => { setOpen(false); setResult(null); setError(""); }}
          className="rounded border px-2 py-1 text-xs hover:bg-muted/40"
        >
          ✕
        </button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {result && (
        <div className="text-xs">
          <span className="text-green-700 font-medium">Einladung erstellt!</span>
          <input
            readOnly
            value={result.link}
            className="mt-1 w-full rounded border bg-muted/20 px-1.5 py-0.5 text-[10px] font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>
      )}
    </div>
  );
}
