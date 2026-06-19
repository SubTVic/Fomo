// SPDX-License-Identifier: AGPL-3.0-only
"use client";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-body">
        <span>
          Frage {current} von {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1.5 h-3 w-full border-2 border-navy bg-card">
        <div
          className="h-full bg-navy transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
