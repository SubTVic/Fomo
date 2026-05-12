// SPDX-License-Identifier: AGPL-3.0-only

export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { STUDY2_ITEMS, STUDY2_FILTER } from "@/lib/study2/items";
import { GroupEditForm } from "./GroupEditForm";
import { ToggleActiveButton } from "./ToggleActiveButton";
import { MergeButton } from "./MergeButton";

interface AdminGroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGroupDetailPage({
  params,
}: AdminGroupDetailPageProps) {
  const { id } = await params;

  const [group, categories] = await Promise.all([
    db.group.findUnique({
      where: { id },
      include: {
        category: true,
        duplicateOf: { select: { id: true, name: true } },
        duplicates: { select: { id: true, name: true, registeredVia: true } },
        selfRating: { include: { answers: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!group) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/groups"
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; Alle Gruppen
          </Link>
          <h1 className="font-heading text-2xl uppercase mt-1">
            {group.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                group.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {group.isActive ? "Aktiv" : "Inaktiv"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                group.isVerified
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {group.isVerified ? "Verifiziert" : "Nicht verifiziert"}
            </span>
          </div>
        </div>
        <ToggleActiveButton groupId={group.id} isActive={group.isActive} />
      </div>

      {/* Duplicate warning: this group IS a duplicate of an existing one */}
      {group.duplicateOf && (
        <div className="mb-4 border-2 border-purple-400 bg-purple-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-purple-800">
              Mögliches Duplikat erkannt
            </p>
            <p className="text-xs text-purple-700 mt-0.5">
              Diese selbstregistrierte Gruppe ähnelt stark:{" "}
              <a
                href={`/admin/groups/${group.duplicateOf.id}`}
                className="underline font-medium"
              >
                {group.duplicateOf.name}
              </a>
            </p>
          </div>
          <MergeButton
            sourceGroupId={group.id}
            targetGroupId={group.duplicateOf.id}
            targetGroupName={group.duplicateOf.name}
          />
        </div>
      )}

      {/* Reverse: this existing group has self-registered duplicates pointing at it */}
      {group.duplicates.length > 0 && (
        <div className="mb-4 border-2 border-orange-300 bg-orange-50 px-5 py-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">
            Selbstregistrierte Anwärter ({group.duplicates.length})
          </p>
          <div className="flex flex-col gap-2">
            {group.duplicates.map((dup) => (
              <div key={dup.id} className="flex items-center justify-between gap-3">
                <a
                  href={`/admin/groups/${dup.id}`}
                  className="text-sm text-orange-700 underline"
                >
                  {dup.name}
                </a>
                <MergeButton
                  sourceGroupId={dup.id}
                  targetGroupId={group.id}
                  targetGroupName={group.name}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="border-2 border-foreground bg-card p-6">
        <GroupEditForm group={group} categories={categories} />
      </div>

      {/* Self-Rating Panel */}
      <div className="mt-6 border-2 border-foreground bg-card p-6">
        <h2 className="font-heading text-lg uppercase mb-1">Self-Rating (WS2)</h2>
        {group.selfRating ? (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Eingereicht:{" "}
              {new Date(group.selfRating.submittedAt).toLocaleString("de-DE")} ·{" "}
              {group.selfRating.raterCount === 1
                ? "1 Person"
                : group.selfRating.raterCount === 2
                ? "2 Personen"
                : "3+ Personen"}
            </p>

            {/* Filter selections */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Aktivitäten (Filter)</p>
              {(() => {
                const sel = (group.selfRating.filterSelections as string[] | null) ?? [];
                if (sel.length === 0) return <p className="text-xs text-muted-foreground">Keine Auswahl</p>;
                const labels = sel.map(
                  (attr) => STUDY2_FILTER.options.find((o) => o.attribute === attr)?.label ?? attr
                );
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((l) => (
                      <span key={l} className="border border-foreground px-2 py-0.5 text-xs font-medium">{l}</span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Item answers */}
            <div className="divide-y divide-foreground/10">
              {STUDY2_ITEMS.map((item) => {
                const answer = group.selfRating!.answers.find((a) => a.itemId === item.id);
                const val = answer?.value ?? null;
                const label =
                  val === 1 ? "Stimme zu" : val === -1 ? "Stimme nicht zu" : val === 0 ? "Neutral" : "–";
                const color =
                  val === 1 ? "text-green-700" : val === -1 ? "text-red-600" : "text-muted-foreground";
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <span className="text-muted-foreground w-14 shrink-0 text-xs">{item.id}</span>
                    <span className="flex-1">{item.text}</span>
                    <span className={`shrink-0 text-xs font-medium ${color}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Noch kein Self-Rating abgegeben.</p>
        )}
      </div>
    </div>
  );
}
