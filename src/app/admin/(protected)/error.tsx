// SPDX-License-Identifier: AGPL-3.0-only
"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <div className="border-4 border-foreground p-8 bg-card text-center">
        <h2 className="font-heading text-xl uppercase mb-4">Fehler</h2>
        <p className="text-sm text-muted-foreground mb-6">Ein unerwarteter Fehler ist aufgetreten.</p>
        <button onClick={reset} className="bg-foreground text-background px-6 py-3 text-sm font-semibold uppercase hover:opacity-90">Erneut versuchen</button>
      </div>
    </div>
  );
}
