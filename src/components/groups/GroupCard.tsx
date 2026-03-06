// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import type { GroupWithCategory } from "@/types";

interface GroupCardProps {
  group: GroupWithCategory;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      {/* Category badge */}
      <span
        className="w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
        style={{ backgroundColor: group.category.color ?? "#6b7280" }}
      >
        {group.category.name}
      </span>

      {/* Name + description */}
      <div>
        <h3 className="font-semibold">{group.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{group.shortDescription}</p>
      </div>

      {/* Meta info */}
      <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
        {group.memberCount && <span>{group.memberCount} Mitglieder</span>}
        {group.meetingSchedule && <span>{group.meetingSchedule}</span>}
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 text-xs">
        {group.websiteUrl && (
          <a
            href={group.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Website
          </a>
        )}
        {group.instagramUrl && (
          <a
            href={group.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Instagram
          </a>
        )}
        {group.contactEmail && (
          <a
            href={`mailto:${group.contactEmail}`}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            E-Mail
          </a>
        )}
      </div>
    </div>
  );
}
