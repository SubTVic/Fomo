// SPDX-License-Identifier: AGPL-3.0-only

import { getActiveGroups } from "@/lib/queries/groups";
import { GroupGrid } from "@/components/groups/GroupGrid";

interface GroupsPageProps {
  searchParams: Promise<{ kategorie?: string }>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const { kategorie } = await searchParams;
  const allGroups = await getActiveGroups();

  // Client-side category filter via URL param
  const groups = kategorie
    ? allGroups.filter((g) => g.category.name === kategorie)
    : allGroups;

  // Unique categories for filter buttons
  const categories = Array.from(
    new Map(allGroups.map((g) => [g.category.id, g.category])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Alle Hochschulgruppen</h1>
      <p className="mb-8 text-muted-foreground">{allGroups.length} Gruppen an der TU Dresden</p>

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterLink href="/groups" active={!kategorie}>
          Alle
        </FilterLink>
        {categories.map((cat) => (
          <FilterLink
            key={cat.id}
            href={`/groups?kategorie=${encodeURIComponent(cat.name)}`}
            active={kategorie === cat.name}
          >
            {cat.name}
          </FilterLink>
        ))}
      </div>

      <GroupGrid groups={groups} />
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-muted"
      }`}
    >
      {children}
    </a>
  );
}
