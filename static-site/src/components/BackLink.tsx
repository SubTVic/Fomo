// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Back link on the group detail page. When the visitor arrived from their quiz
 * results (URL carries ?r=…), it returns to those results instead of the full
 * group list — so they land back on their own ranking.
 */
export function BackLink() {
  const [r, setR] = useState<string | null>(null);
  useEffect(() => {
    setR(new URLSearchParams(window.location.search).get("r"));
  }, []);

  const href = r ? `/quiz/?r=${encodeURIComponent(r)}` : "/groups";
  const label = r ? "← Zurück zu deinen Ergebnissen" : "← Alle Gruppen";

  return (
    <Link
      href={href}
      className="text-xs font-semibold uppercase tracking-wide text-body hover:text-navy"
    >
      {label}
    </Link>
  );
}
