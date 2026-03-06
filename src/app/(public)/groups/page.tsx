// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getActiveGroups, getActiveGroupCount } from "@/lib/queries/groups";
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
    <div className="flex flex-col">
      {/* Hero – Registrierung */}
      <section className="border-b bg-muted/30 px-4 py-14">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Hochschulgruppen
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Deine Hochschulgruppe auf FOMO</h1>
          <p className="max-w-xl text-muted-foreground">
            Erstis suchen euch – lasst euch finden. Registriert eure Gruppe, füllt euer Profil aus
            und werdet Teil des Matchings.
          </p>
          <Link
            href="/groups/register"
            className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Gruppe registrieren →
          </Link>
          <div className="flex gap-8 text-center mt-2">
            <Stat value="6.300" label="Erstis pro Jahr" />
            <Stat value={String(totalCount)} label="Gruppen dabei" />
            <Stat value="kostenlos" label="& in ~15 min" />
          </div>
        </div>
      </section>

      {/* Group browse */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="mb-2 text-2xl font-bold">Alle Hochschulgruppen</h2>
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
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
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
