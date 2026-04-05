// SPDX-License-Identifier: AGPL-3.0-only
"use client";

export default function FullscreenError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-6" style={{ background: "#ADD8E6" }}>
      <div className="w-full max-w-sm border-4 border-[#1a2a35] bg-white p-8 text-center">
        <h2 className="text-lg font-bold uppercase text-[#1a2a35] mb-3">Etwas ist schiefgelaufen</h2>
        <p className="text-sm text-[#5a7a8a] mb-6">Ein unerwarteter Fehler ist aufgetreten.</p>
        <button onClick={reset} className="w-full bg-[#1a2a35] text-[#ADD8E6] py-3 text-sm font-bold uppercase hover:bg-[#2a3a45] transition-colors">Erneut versuchen</button>
      </div>
    </div>
  );
}
