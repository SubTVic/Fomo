// SPDX-License-Identifier: AGPL-3.0-only

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { CreateGroupForm } from "./CreateGroupForm";
import { requireAdminPage } from "@/lib/require-admin";

export default async function NewGroupPage() {
  await requireAdminPage();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl uppercase mb-6">Neue Gruppe anlegen</h1>
      <CreateGroupForm categories={categories} />
    </div>
  );
}
