// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { usePathname } from "next/navigation";
import type { Group } from "@/lib/types";
import { track, EVENTS } from "@/lib/analytics";

export function GroupLinks({ group }: { group: Group }) {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const links: Array<{ href: string; label: string; dest: string }> = [];
  if (group.websiteUrl) links.push({ href: group.websiteUrl, label: "Website", dest: "website" });
  if (group.instagramUrl)
    links.push({ href: group.instagramUrl, label: "Instagram", dest: "instagram" });
  if (group.contactEmail)
    links.push({ href: `mailto:${group.contactEmail}`, label: isEnglish ? "E-mail" : "E-Mail", dest: "email" });

  if (links.length === 0) {
    return (
      <p className="text-sm text-muted">
        {isEnglish ? "No contact information available." : "Keine Kontaktinfos hinterlegt."}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((l) => (
        <a
          key={l.dest}
          href={l.href}
          target={l.dest === "email" ? undefined : "_blank"}
          rel={l.dest === "email" ? undefined : "noopener noreferrer"}
          onClick={() => track(EVENTS.groupClick, { group: group.slug, dest: l.dest, context: "detail" })}
          className="border-poster bg-navy px-5 py-3 font-heading text-sky transition-colors hover:bg-navy-hover"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
