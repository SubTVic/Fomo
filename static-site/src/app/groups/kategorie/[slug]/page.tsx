// SPDX-License-Identifier: AGPL-3.0-only
// SEO landing page per category — targets generic queries like
// "Sport Hochschulgruppen Dresden". Fully server-rendered (crawlable text),
// German only (the queries are German; EN users browse /en/groups).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroups, categoryColorOf, isUnverified } from "@/lib/data";
import { CATEGORY_SEO, getCategorySeoBySlug } from "@/lib/categories";
import { sitePath, breadcrumbLd, groupListLd } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORY_SEO.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategorySeoBySlug(slug);
  if (!cat) return { title: "Kategorie nicht gefunden" };
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: sitePath(`/groups/kategorie/${cat.slug}`) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategorySeoBySlug(slug);
  if (!cat) notFound();

  // Verified first (real profiles), unverified after with a clear marker.
  const inCategory = getGroups()
    .filter((g) => g.categoryName === cat.categoryName)
    .sort((a, b) => Number(isUnverified(a)) - Number(isUnverified(b)) || a.name.localeCompare(b.name, "de"));
  const others = CATEGORY_SEO.filter((c) => c.slug !== cat.slug);

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbLd([
              { name: "Start", path: "/" },
              { name: "Gruppen", path: "/groups" },
              { name: cat.title, path: `/groups/kategorie/${cat.slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(groupListLd(inCategory, "de", cat.title)),
        }}
      />

      <Link
        href="/groups"
        className="text-xs font-semibold uppercase tracking-wide text-body hover:text-navy"
      >
        ← Alle Gruppen
      </Link>

      <h1 className="mt-4 hyphens-auto break-words text-3xl text-navy sm:text-4xl">{cat.title}</h1>
      <p className="mt-3 max-w-prose text-body">{cat.intro}</p>
      <p className="mt-2 text-sm text-muted">
        {inCategory.length} {inCategory.length === 1 ? "Gruppe" : "Gruppen"} in dieser Kategorie —
        oder mach das <Link href="/quiz" className="underline underline-offset-4 hover:text-navy">Quiz</Link>,
        um deine persönlichen Matches aus allen Hochschulgruppen zu finden.
      </p>

      <div className="mt-7 grid gap-4">
        {inCategory.map((g) => (
          <article key={g.id} className="border-poster bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 hyphens-auto break-words font-heading text-lg text-navy">
                <Link href={`/groups/${g.slug}/`} className="hover:underline">
                  {g.name}
                </Link>
              </h2>
              <span
                aria-hidden
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColorOf(g) }}
              />
            </div>
            {isUnverified(g) && (
              <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-muted">
                ⓘ Profil noch nicht von der Gruppe bestätigt
              </span>
            )}
            <p className="mt-2 text-sm text-body">{g.shortDescription}</p>
            <Link
              href={`/groups/${g.slug}/`}
              className="mt-3 inline-block text-sm font-semibold text-accent-muted underline underline-offset-4 hover:text-navy"
            >
              Profil öffnen →
            </Link>
          </article>
        ))}
        {inCategory.length === 0 && (
          <p className="border-poster bg-card p-6 text-body">
            In dieser Kategorie ist aktuell keine Gruppe eingetragen — schau bei{" "}
            <Link href="/groups" className="underline">allen Gruppen</Link> vorbei.
          </p>
        )}
      </div>

      <nav aria-label="Weitere Kategorien" className="mt-10 border-t-2 border-navy pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Weitere Kategorien
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/groups/kategorie/${c.slug}/`}
                className="text-body underline underline-offset-4 hover:text-navy"
              >
                {c.categoryName}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
