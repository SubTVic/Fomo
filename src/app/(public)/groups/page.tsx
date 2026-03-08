// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getActiveGroups, getActiveGroupCount } from "@/lib/queries/groups";

export const dynamic = "force-dynamic";
import { GroupGrid } from "@/components/groups/GroupGrid";

interface GroupsPageProps {
  searchParams: Promise<{ kategorie?: string }>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const { kategorie } = await searchParams;
  const [allGroups, totalCount] = await Promise.all([getActiveGroups(), getActiveGroupCount()]);

  const groups = kategorie
    ? allGroups.filter((g) => g.category.name === kategorie)
    : allGroups;

  const categories = Array.from(
    new Map(allGroups.map((g) => [g.category.id, g.category])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[1000px] border-4 border-foreground bg-card">
        {/* Hero header */}
        <div className="bg-foreground text-primary-foreground px-6 py-8 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-primary-foreground/50 mb-2">
            Hochschulgruppen
          </p>
          <h1 className="font-heading text-[clamp(22px,4vw,40px)] uppercase leading-none mb-4">
            Deine Hochschulgruppe auf FOMO
          </h1>
          <p className="text-sm text-primary-foreground/70 max-w-lg mb-6">
            Erstis suchen euch – lasst euch finden. Registriert eure Gruppe, füllt euer Profil aus
            und werdet Teil des Matchings.
          </p>
          <Link
            href="/groups/register"
            className="inline-block border-2 border-primary-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-primary-foreground hover:text-foreground transition-colors"
          >
            Gruppe registrieren
          </Link>
          <div className="flex gap-8 mt-6">
            <Stat value="6.300" label="Erstis pro Jahr" />
            <Stat value={String(totalCount)} label="Gruppen dabei" />
            <Stat value="kostenlos" label="& in ~15 min" />
          </div>
        </div>

        {/* Group browse */}
        <div className="border-t-4 border-foreground px-6 py-8 sm:px-8">
          <h2 className="font-heading text-xl uppercase mb-1">Alle Hochschulgruppen</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {allGroups.length} Gruppen an der TU Dresden
          </p>

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
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-bold text-primary-foreground">{value}</span>
      <span className="text-xs text-primary-foreground/50">{label}</span>
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
      className={`border-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active
          ? "bg-foreground text-primary-foreground border-foreground"
          : "border-foreground/30 hover:border-foreground hover:bg-accent"
      }`}
    >
      {children}
    </a>
  );
}
