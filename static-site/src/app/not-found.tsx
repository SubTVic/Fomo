// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import Link from "next/link";

// Explicit noindex — self-documenting, and avoids relying on Next's implicit
// not-found handling to keep 404s out of the index.
export const metadata: Metadata = {
  title: "Nicht gefunden",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-heading text-6xl text-navy">404</h1>
      <p className="mt-3 text-body">Diese Seite gibt es nicht (mehr).</p>
      <Link
        href="/"
        className="mt-6 border-poster bg-navy px-6 py-3 font-heading text-sky transition-colors hover:bg-navy-hover"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
