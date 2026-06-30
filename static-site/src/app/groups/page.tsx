// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getGroups, getCategories } from "@/lib/data";
import { GroupBrowser } from "@/components/GroupBrowser";
import { seoAlternates, groupListLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Alle Gruppen",
  description: "Stöbere durch alle Hochschulgruppen der TU Dresden.",
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
      <h1 className="text-3xl text-navy sm:text-4xl">Alle Hochschulgruppen</h1>
      <p className="mt-2 max-w-prose text-body">{groups.length} Gruppen an der TU Dresden</p>

      <div className="mt-7">
        <GroupBrowser groups={groups} categories={categories} lang="de" />
      </div>
    </div>
  );
}
