// SPDX-License-Identifier: AGPL-3.0-only
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-6"
      style={{ background: "#ADD8E6" }}
    >
      <div className="w-full max-w-sm border-4 border-[#1a2a35] bg-white p-8 text-center">
        <div className="text-4xl mb-4">😵</div>
        <h2
          className="text-lg font-bold uppercase text-[#1a2a35] mb-3"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Etwas ist schiefgelaufen
        </h2>
        <p className="text-sm text-[#5a7a8a] mb-6">
          Bitte versuche es erneut oder lade die Seite neu.
        </p>
        <button
          onClick={reset}
          className="w-full bg-[#1a2a35] text-[#ADD8E6] py-3 text-sm font-bold uppercase tracking-wide hover:bg-[#2a3a45] transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
