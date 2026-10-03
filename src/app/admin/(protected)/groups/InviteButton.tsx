// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InviteButtonProps {
  groupId: string;
  groupName: string;
  contactEmail: string | null;
}

/** Mail template from docs/runbooks/03-link-verloren.md. */
function mailtoHref(to: string, groupName: string, link: string): string {
  const subject = "Euer Link für das FOMO-Profil";
  const body = [
    `Hallo ${groupName},`,
    "",
    `hier ist euer Link zum Bearbeiten eures FOMO-Profils: ${link}`,
    "",
    "Eure bisherigen Antworten sind schon eingetragen – ändert einfach, was nicht mehr passt, und schickt am Ende ab (ca. 5 Minuten). Nur Beschreibung, Website oder Kontakt ändern geht noch schneller: auf der Startseite „Nur Gruppeninfos ändern“ wählen.",
    "",
    "Der Link gilt 12 Monate und kann mehrmals benutzt werden. Bitte nicht öffentlich teilen – wer ihn hat, kann euer Profil ändern.",
    "",
    "Viele Grüße",
    "das FOMO-Team",
  ].join("\n");
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function InviteButton({ groupId, groupName, contactEmail }: InviteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [link, setLink] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function createLink() {
    setStatus("loading");
    setMessage("");
    setLink(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/edit-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeOthers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Fehler beim Erzeugen");
        setStatus("error");
        return;
      }
      setLink(data.link);
      setStatus("done");
      router.refresh();
    } catch {
      setMessage("Netzwerkfehler");
      setStatus("error");
    }
  }

  async function revokeAll() {
    if (!window.confirm(`Alle Bearbeitungslinks von „${groupName}“ zurückziehen?`)) return;
    setStatus("loading");
    setLink(null);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/edit-link`, { method: "DELETE" });
      const data = await res.json();
      setMessage(res.ok ? `${data.revoked} Link(s) zurückgezogen.` : data.error ?? "Fehler");
      setStatus(res.ok ? "idle" : "error");
    } catch {
      setMessage("Netzwerkfehler");
      setStatus("error");
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
        title={`Bearbeitungslink für ${groupName}`}
      >
        Bearbeitungslink
      </button>
    );
  }

  return (
    <div className="flex min-w-[240px] flex-col gap-1.5 text-left text-xs">
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={revokeOthers}
          onChange={(e) => setRevokeOthers(e.target.checked)}
        />
        alte Links dieser Gruppe zurückziehen
      </label>
      <div className="flex gap-1">
        <button
          onClick={createLink}
          disabled={status === "loading"}
          className="rounded border bg-primary px-2 py-1 font-medium text-primary-foreground whitespace-nowrap disabled:opacity-50"
        >
          {status === "loading" ? "…" : "Link erzeugen"}
        </button>
        <button
          onClick={revokeAll}
          disabled={status === "loading"}
          className="rounded border px-2 py-1 whitespace-nowrap hover:bg-muted/40 disabled:opacity-50"
        >
          Alle zurückziehen
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setLink(null);
            setMessage("");
          }}
          className="rounded border px-2 py-1 hover:bg-muted/40"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>
      {message && (
        <span className={status === "error" ? "text-destructive" : "text-muted-foreground"}>{message}</span>
      )}
      {link && (
        <div>
          <span className="font-medium text-green-700">
            Link erzeugt – wird nur jetzt angezeigt. Gültig 12 Monate, mehrfach nutzbar.
          </span>
          <input
            readOnly
            value={link}
            aria-label="Bearbeitungslink"
            className="mt-1 w-full rounded border bg-muted/20 px-1.5 py-0.5 font-mono text-[10px]"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <div className="mt-1 flex gap-2">
            <button onClick={copy} className="rounded border px-2 py-0.5 hover:bg-muted/40">
              {copied ? "Kopiert ✓" : "Kopieren"}
            </button>
            {contactEmail ? (
              <a
                href={mailtoHref(contactEmail, groupName, link)}
                className="rounded border px-2 py-0.5 hover:bg-muted/40"
              >
                Mail an {contactEmail}
              </a>
            ) : (
              <span className="text-muted-foreground">Keine Kontaktadresse hinterlegt.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
