// SPDX-License-Identifier: AGPL-3.0-only

import { db } from "@/lib/db";
import { CreateGroupForm } from "./CreateGroupForm";

export default async function NewGroupPage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl uppercase mb-6">Neue Gruppe anlegen</h1>
      <CreateGroupForm categories={categories} />
    </div>
  );
}
