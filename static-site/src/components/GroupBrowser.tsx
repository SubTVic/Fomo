// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useMemo, useState } from "react";
import type { Group } from "@/lib/types";
import { GroupCard } from "./GroupCard";

interface GroupBrowserProps {
  groups: Group[];
  categories: Array<{ name: string; color: string }>;
}

export function GroupBrowser({ groups, categories }: GroupBrowserProps) {
  const [active, setActive] = useState<string | null>(null);

  const visible = useMemo(
    () => (active ? groups.filter((g) => g.categoryName === active) : groups),
    [groups, active],
  );

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <Chip selected={active === null} onClick={() => setActive(null)}>
          Alle ({groups.length})
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.name}
            selected={active === c.name}
            color={c.color}
            onClick={() => setActive(active === c.name ? null : c.name)}
          >
            {c.name}
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
