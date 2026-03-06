// SPDX-License-Identifier: AGPL-3.0-only

import { GroupCard } from "./GroupCard";
import type { GroupWithCategory } from "@/types";

interface GroupGridProps {
  groups: GroupWithCategory[];
}

export function GroupGrid({ groups }: GroupGridProps) {
  if (groups.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Keine Hochschulgruppen gefunden.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
