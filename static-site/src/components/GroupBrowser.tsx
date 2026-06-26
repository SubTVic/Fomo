// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Group } from "@/lib/types";
import { categoryColorOf, isUnverified } from "@/lib/data";
import { groupCategory, groupLongText, groupShortText } from "@/lib/group-copy";
import { UnverifiedNotice } from "./UnverifiedNotice";

interface GroupBrowserProps {
  groups: Group[];
  categories: Array<{ name: string; color: string }>;
  lang?: "de" | "en";
}

export function GroupBrowser({ groups, categories, lang = "de" }: GroupBrowserProps) {
  const [active, setActive] = useState("");
  const [showUnverified, setShowUnverified] = useState(false);

  const verifiedCount = useMemo(() => groups.filter((g) => !isUnverified(g)).length, [groups]);
  const unverifiedCount = groups.length - verifiedCount;

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      if (!showUnverified && isUnverified(group)) continue;
      const label = groupCategory(group, lang);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return counts;
  }, [groups, showUnverified]);

  const availableCategories = categories
    .map((category) => ({
      key: category.name,
      label: lang === "en" ? categoryNameToEnglish(category.name) : category.name,
    }))
    .filter((category) => (countByCategory.get(category.label) ?? 0) > 0);

  const visible = useMemo(() => {
    let list = showUnverified ? groups : groups.filter((g) => !isUnverified(g));
    if (active) list = list.filter((g) => groupCategory(g, lang) === active);
    return [...list].sort((a, b) =>
      sortKey(a.name).localeCompare(sortKey(b.name), "de", { sensitivity: "base" }),
    );
  }, [groups, active, showUnverified]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <FilterButton active={active === ""} onClick={() => setActive("")}>
          {lang === "en" ? "All" : "Alle"}
        </FilterButton>
        {availableCategories.map((category) => (
          <FilterButton
            key={category.key}
            active={active === category.label}
            onClick={() => setActive(active === category.label ? "" : category.label)}
          >
            {category.label}
          </FilterButton>
        ))}
      </div>

      {unverifiedCount > 0 && (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={showUnverified}
            onChange={(e) => setShowUnverified(e.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          <span>
            {lang === "en"
              ? `Show unverified groups (${unverifiedCount})`
              : `Auch unbestätigte Gruppen anzeigen (${unverifiedCount})`}
          </span>
        </label>
      )}

      {showUnverified && (
        <div className="mt-4">
          <UnverifiedNotice />
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((group) => (
          <GroupTile key={group.id} group={group} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function sortKey(name: string) {
  return name.replace(/^\d+\s*/, "").trim();
}

function categoryNameToEnglish(name: string) {
  return (
    {
      "Internationales": "International",
      "Kunst & Kultur": "Arts & culture",
      "Nachhaltigkeit": "Sustainability",
      "Politik & Gesellschaft": "Politics & society",
      "Sonstiges": "Other",
      "Soziales Engagement": "Social engagement",
      "Sport & Bewegung": "Sports & movement",
      "Technik & Wissenschaft": "Technology & science",
      "Wirtschaft & Karriere": "Business & career",
    }[name] ?? name
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 border-navy px-4 py-2 font-heading text-sm transition-colors ${
        active ? "bg-navy text-sky" : "bg-card text-navy hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function GroupTile({ group, lang }: { group: Group; lang: "de" | "en" }) {
  const [expanded, setExpanded] = useState(false);
  const website = group.websiteUrl;
  const prefix = lang === "en" ? "/en" : "";
  const shortDescription = groupShortText(group, lang);
  const longDescription = groupLongText(group, lang);
  const text = expanded ? longDescription : shortDescription;
  const canExpand = longDescription.length > shortDescription.length + 20;

  return (
    <article className="flex min-h-[280px] flex-col border-2 border-navy bg-card p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <span
        className="w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
        style={{ backgroundColor: categoryColorOf(group) }}
      >
        {groupCategory(group, lang)}
      </span>

      <h2 className="mt-5 break-words font-heading text-lg leading-snug text-navy">{group.name}</h2>

      {group.selfRating.derived && (
        <span className="mt-2 w-fit border border-[#ffcc3d] bg-[#fff8d8] px-2 py-1 text-xs text-[#8a5b00]">
          {lang === "en" ? "Not confirmed by the group" : "Nicht von der Gruppe bestätigt"}
        </span>
      )}

      <div className="mt-3 text-base leading-relaxed text-body">
        <p className={expanded ? "whitespace-pre-line" : "line-clamp-4"}>{text}</p>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-1 text-sm font-semibold text-muted underline underline-offset-4 transition-colors hover:text-navy"
          >
            {lang === "en"
              ? expanded
                ? "show less"
                : "show more"
              : expanded
                ? "Weniger anzeigen"
                : "mehr anzeigen"}
          </button>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6 text-sm font-semibold">
        <Link
          href={`${prefix}/groups/${group.slug}/`}
          className="underline underline-offset-4 transition-transform hover:-translate-y-0.5 hover:text-accent-muted active:translate-y-0"
        >
          {lang === "en" ? "Open profile" : "Profil öffnen"}
        </Link>
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-accent-muted"
          >
            Website
          </a>
        )}
      </div>
    </article>
  );
}
