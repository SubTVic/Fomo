// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateInvitesButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [csvOutput, setCsvOutput] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    setMessage("");
    setCsvOutput("");

    try {
      // Fetch all groups that have an email but no invite yet
      const groupsRes = await fetch("/api/admin/groups/pending");
      const groupsData = await groupsRes.json();

      if (!groupsRes.ok) {
        setStatus("error");
        setMessage(groupsData.error ?? "Fehler beim Laden der Gruppen");
        return;
      }

      const groups = groupsData.groups as {
        id: string;
        name: string;
        contactEmail: string | null;
        registrationStatus: string | null;
      }[];

      // Filter to groups that have emails and haven't been invited yet
      const toInvite = groups.filter(
        (g) => g.contactEmail && (!g.registrationStatus || g.registrationStatus === "invited"),
      );

      if (toInvite.length === 0) {
        setStatus("done");
        setMessage("Keine Gruppen mit E-Mail-Adressen zum Einladen gefunden.");
        return;
      }

      const res = await fetch("/api/admin/groups/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invites: toInvite.map((g) => ({
            groupId: g.id,
            email: g.contactEmail!,
            expiresInDays: 30,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("done");
        setMessage(`${data.invites.length} Einladungen generiert`);

        // Build CSV for easy copy-paste into email tool
        const lines = ["name,email,token,link"];
        for (const inv of data.invites) {
          const group = toInvite.find((g) => g.id === inv.groupId);
          const link = `${window.location.origin}/groups/register?token=${inv.token}`;
          lines.push(`"${group?.name ?? ""}","${inv.email}","${inv.token}","${link}"`);
        }
        setCsvOutput(lines.join("\n"));
      } else {
        setStatus("error");
        setMessage(data.error ?? "Fehler beim Generieren");
      }
    } catch {
      setStatus("error");
      setMessage("Netzwerkfehler");
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {message && (
          <span
            className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {message}
          </span>
        )}
        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "Generiere…" : "Einladungen generieren"}
        </button>
      </div>

      {csvOutput && (
        <div className="w-full max-w-xl">
          <textarea
            readOnly
            value={csvOutput}
            rows={6}
            className="w-full rounded border bg-muted/20 p-2 text-xs font-mono"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <p className="text-xs text-muted-foreground mt-1">
            CSV mit Einladungslinks — klicken zum Markieren, dann kopieren.
          </p>
        </div>
      )}
    </div>
  );
}
