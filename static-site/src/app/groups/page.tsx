// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getGroups, getCategories } from "@/lib/data";
import Link from "next/link";
import { GroupBrowser } from "@/components/GroupBrowser";
import { seoAlternates, groupListLd } from "@/lib/site";
import { CATEGORY_SEO } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Alle Hochschulgruppen der TU Dresden im Überblick",
  description:
    "Über 90 Hochschulgruppen, Vereine und studentische Initiativen an der TU Dresden — nach Kategorie stöbern oder per Quiz die passende Gruppe finden.",
  alternates: seoAlternates("/groups", "/en/groups", "de"),
};

export default function GroupsPage() {
  const groups = getGroups();
  const categories = getCategories();

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(groupListLd(groups, "de", "Hochschulgruppen der TU Dresden")),
        }}
      />
      <h1 className="hyphens-auto break-words text-3xl text-navy sm:text-4xl">
        Alle Hochschulgruppen
      </h1>
      <p className="mt-2 max-w-prose text-body">{groups.length} Gruppen an der TU Dresden</p>

      {/* Real links (crawlable) to the per-category landing pages — the chips
          below are client-side filters and invisible to search engines. */}
      <nav aria-label="Kategorie-Seiten" className="mt-3 text-sm text-body">
        <span className="font-semibold">Nach Interesse: </span>
        {CATEGORY_SEO.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && " · "}
            <Link
              href={`/groups/kategorie/${c.slug}/`}
              className="underline underline-offset-4 hover:text-navy"
            >
              {c.categoryName}
            </Link>
          </span>
        ))}
      </nav>

      <div className="mt-7">
        <GroupBrowser groups={groups} categories={categories} lang="de" />
      </div>
    </div>
  );
}
