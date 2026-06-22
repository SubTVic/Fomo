// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getGroups, getCategories, isUnverified } from "@/lib/data";
import { GroupBrowser } from "@/components/GroupBrowser";

export const metadata: Metadata = {
  title: "Alle Gruppen",
  description: "Stöbere durch alle Hochschulgruppen der TU Dresden.",
};

export default function GroupsPage() {
  const groups = getGroups();
  const categories = getCategories();
  const verifiedCount = groups.filter((g) => !isUnverified(g)).length;

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl text-navy sm:text-4xl">Alle Gruppen</h1>
      <p className="mt-2 max-w-prose text-body">
        {verifiedCount} bestätigte Hochschulgruppen der TU Dresden. Filtere nach Kategorie
        oder mach das Quiz für persönliche Empfehlungen.
      </p>

      <div className="mt-7">
        <GroupBrowser groups={groups} categories={categories} />
      </div>
    </div>
  );
}
