// SPDX-License-Identifier: AGPL-3.0-only

export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { WS2_ITEMS, WS2_FILTER } from "@/lib/ws2-items";
import { GroupEditForm } from "./GroupEditForm";
import { ToggleActiveButton } from "./ToggleActiveButton";
import { MergeButton } from "./MergeButton";
import { SelfRatingEditor } from "./SelfRatingEditor";
import { requireAdminPage } from "@/lib/require-admin";

interface AdminGroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGroupDetailPage({
  params,
}: AdminGroupDetailPageProps) {
  await requireAdminPage();
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

      {/* Unverified: data is likely AI-generated from the scraper */}
      {!group.isVerified && (
        <div className="mb-4 border-2 border-yellow-400 bg-yellow-50 px-5 py-3">
          <p className="text-sm font-semibold text-yellow-900">
            ⚠️ Daten noch nicht von der Gruppe bestätigt
          </p>
          <p className="text-xs text-yellow-800 mt-0.5">
            Beschreibung und Attribute stammen vermutlich aus dem KI-Scraper und sind nicht verifiziert.
          </p>
        </div>
      )}

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
            sourceGroupName={group.name}
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
                  sourceGroupName={dup.name}
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

      {/* Self-Rating: the group's 21 answers + activity filters (editable, logged) */}
      <div className="mt-6 border-2 border-foreground bg-card p-6">
        <h2 className="font-heading text-lg uppercase mb-1">Quiz-Profil (21 Fragen + Filter)</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {group.selfRating
            ? `Zuletzt eingereicht: ${new Date(group.selfRating.submittedAt).toLocaleString("de-DE")}. `
            : ""}
          Änderungen hier landen im Änderungsprotokoll. Im Quiz ist die Gruppe nur, wenn sie
          verifiziert ist.
        </p>
        <SelfRatingEditor
          groupId={group.id}
          items={WS2_ITEMS.map((i) => ({ id: i.id, text: i.text }))}
          filters={WS2_FILTER.options.map((o) => ({ attribute: o.attribute, label: o.label }))}
          initial={
            group.selfRating
              ? {
                  raterCount: group.selfRating.raterCount,
                  filterSelections: Array.isArray(group.selfRating.filterSelections)
                    ? group.selfRating.filterSelections.filter((x): x is string => typeof x === "string")
                    : [],
                  answers: Object.fromEntries(group.selfRating.answers.map((a) => [a.itemId, a.value])),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
