// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useMemo, useState } from "react";
import type { Group } from "@/lib/types";
import { isUnverified } from "@/lib/data";
import { GroupCard } from "./GroupCard";
import { UnverifiedNotice } from "./UnverifiedNotice";

interface GroupBrowserProps {
  groups: Group[];
  categories: Array<{ name: string; color: string }>;
}

export function GroupBrowser({ groups, categories }: GroupBrowserProps) {
  const [active, setActive] = useState<string | null>(null);
  const [showUnverified, setShowUnverified] = useState(false);

  const verifiedCount = useMemo(
    () => groups.filter((g) => !isUnverified(g)).length,
    [groups],
  );
  const unverifiedCount = groups.length - verifiedCount;

  const visible = useMemo(() => {
    let list = showUnverified ? groups : groups.filter((g) => !isUnverified(g));
    if (active) list = list.filter((g) => g.categoryName === active);
    return list;
  }, [groups, active, showUnverified]);

  const totalForChips = showUnverified ? groups.length : verifiedCount;
  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of groups) {
      if (!showUnverified && isUnverified(g)) continue;
      m.set(g.categoryName, (m.get(g.categoryName) ?? 0) + 1);
    }
    return m;
  }, [groups, showUnverified]);

  return (
    <div>
      {unverifiedCount > 0 && (
        <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={showUnverified}
            onChange={(e) => setShowUnverified(e.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          <span>Auch unbestätigte Gruppen anzeigen ({unverifiedCount})</span>
        </label>
      )}

      {showUnverified && (
        <div className="mb-4">
          <UnverifiedNotice />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip selected={active === null} onClick={() => setActive(null)}>
          Alle ({totalForChips})
        </Chip>
        {categories
          .filter((c) => (countByCategory.get(c.name) ?? 0) > 0)
          .map((c) => (
            <Chip
              key={c.name}
              selected={active === c.name}
              color={c.color}
              onClick={() => setActive(active === c.name ? null : c.name)}
            >
              {c.name} ({countByCategory.get(c.name) ?? 0})
            </Chip>
          ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}

function Chip({
  children,
  selected,
  color,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 border-2 border-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        selected ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
      }`}
    >
      {color && (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );
}
