// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getGroups, getCategories } from "@/lib/data";
import { GroupBrowser } from "@/components/GroupBrowser";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "All groups",
  description: "Browse all student groups at TU Dresden.",
  alternates: seoAlternates("/groups", "/en/groups", "en"),
};

export default function EnglishGroupsPage() {
  const groups = getGroups();
  const categories = getCategories();

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl text-navy sm:text-4xl">All student groups</h1>
      <p className="mt-2 max-w-prose text-body">{groups.length} groups at TU Dresden</p>

      <div className="mt-7">
        <GroupBrowser groups={groups} categories={categories} lang="en" />
      </div>
    </div>
  );
}
