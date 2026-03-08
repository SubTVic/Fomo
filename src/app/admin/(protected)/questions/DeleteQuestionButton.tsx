// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteQuestionButtonProps {
  questionId: string;
  questionText: string;
}

export default function DeleteQuestionButton({ questionId, questionText }: DeleteQuestionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(typeof data.error === "string" ? data.error : "Fehler beim Loeschen");
        setDeleting(false);
        setConfirming(false);
        return;
      }

      router.refresh();
    } catch {
      alert("Netzwerkfehler");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground max-w-48 truncate">
          &quot;{questionText}&quot; loeschen?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-destructive text-destructive-foreground font-heading uppercase px-3 py-1 text-xs disabled:opacity-50"
        >
          {deleting ? "..." : "Ja"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="border-2 border-foreground/30 px-3 py-1 text-xs text-muted-foreground"
        >
          Nein
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="border-2 border-foreground/30 px-3 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      Loeschen
    </button>
  );
}
