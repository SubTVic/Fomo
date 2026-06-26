// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGroups, getGroupBySlug, categoryColorOf, isUnverified } from "@/lib/data";
import { groupCategory, groupLongText, groupShortText } from "@/lib/group-copy";
import { GroupLinks } from "@/components/GroupLinks";
import { GroupLogo } from "@/components/GroupLogo";
import { BackLink } from "@/components/BackLink";
import { UnverifiedNotice } from "@/components/UnverifiedNotice";

export function generateStaticParams() {
  return getGroups().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) return { title: "Group not found" };
  return {
    title: group.name,
    description: groupShortText(group, "en"),
  };
}

export default async function EnglishGroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) notFound();

  const meta: Array<[string, string]> = [];
  if (group.memberCount) meta.push(["Members", String(group.memberCount)]);
  if (group.groupSize) meta.push(["Size", sizeLabel(group.groupSize)]);
  if (group.eventFrequency) meta.push(["Meetings", frequencyLabel(group.eventFrequency)]);
  if (group.language) meta.push(["Language", languageLabel(group.language)]);
  if (group.foundedYear) meta.push(["Founded", String(group.foundedYear)]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-8 sm:px-6">
      <BackLink />

      <article className="mt-4 border-poster bg-card p-6 poster-shadow sm:p-8">
        <div className="flex items-start gap-4">
          <GroupLogo group={group} size={72} />
          <div>
            <span
              className="w-fit px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColorOf(group) }}
            >
              {groupCategory(group, "en")}
            </span>
            <h1 className="mt-2 text-3xl text-navy sm:text-4xl">{group.name}</h1>
          </div>
        </div>

        {group.motto && <p className="mt-2 text-lg italic text-accent-muted">"{group.motto}"</p>}

        {isUnverified(group) && (
          <div className="mt-4">
            <UnverifiedNotice />
          </div>
        )}

        <p className="mt-5 whitespace-pre-line text-body">{groupLongText(group, "en")}</p>

        {meta.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {meta.map(([label, value]) => (
              <div key={label} className="border-2 border-navy bg-surface p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-7">
          <GroupLinks group={group} />
        </div>
      </article>
    </div>
  );
}

function sizeLabel(s: string): string {
  return { small: "Small", medium: "Medium", large: "Large" }[s] ?? s;
}
function frequencyLabel(f: string): string {
  return { high: "Weekly", medium: "Monthly", low: "Occasionally" }[f] ?? f;
}
function languageLabel(l: string): string {
  return { german: "German", english: "English", both: "German & English" }[l] ?? l;
}
