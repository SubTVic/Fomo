// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BackLink() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const [r, setR] = useState<string | null>(null);

  useEffect(() => {
    setR(new URLSearchParams(window.location.search).get("r"));
  }, []);

  const prefix = isEnglish ? "/en" : "";
  const href = r ? `${prefix}/quiz/?r=${encodeURIComponent(r)}` : `${prefix}/groups`;
  const label = r
    ? isEnglish
      ? "← Back to your results"
      : "← Zurück zu deinen Ergebnissen"
    : isEnglish
      ? "← All groups"
      : "← Alle Gruppen";

  return (
    <Link
      href={href}
      className="text-xs font-semibold uppercase tracking-wide text-body hover:text-navy"
    >
      {label}
    </Link>
  );
}
