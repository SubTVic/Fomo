// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { usePathname } from "next/navigation";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-body">
        <span>
          {isEnglish ? "Question" : "Frage"} {current} {isEnglish ? "of" : "von"} {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1.5 h-3 w-full overflow-hidden border-2 border-navy bg-card">
        <div
          className="h-full bg-navy transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
