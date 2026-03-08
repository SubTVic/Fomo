// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GroupEditForm } from "./GroupEditForm";
import { ToggleActiveButton } from "./ToggleActiveButton";

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
      include: { category: true },
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

      {/* Edit form */}
      <div className="border-2 border-foreground bg-card p-6">
        <GroupEditForm group={group} categories={categories} />
      </div>
    </div>
  );
}
