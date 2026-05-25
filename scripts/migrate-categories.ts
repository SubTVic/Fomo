// SPDX-License-Identifier: AGPL-3.0-only
// One-shot migration: align Category table with the 11-category schema used in the registration form.
//
// Run once against production:
//   DATABASE_URL="<prod url>" pnpm tsx scripts/migrate-categories.ts
//
// Idempotent: safe to re-run. Wrapped in a transaction.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Final target schema. Order = display order in UI.
const TARGET: { name: string; order: number }[] = [
  { name: "Politik & Gesellschaft", order: 1 },
  { name: "Sport & Bewegung", order: 2 },
  { name: "Kunst & Kultur", order: 3 },
  { name: "Musik", order: 4 },
  { name: "Technik & Wissenschaft", order: 5 },
  { name: "Nachhaltigkeit", order: 6 },
  { name: "Internationales", order: 7 },
  { name: "Soziales Engagement", order: 8 },
  { name: "Glaube & Spiritualität", order: 9 },
  { name: "Wirtschaft & Karriere", order: 10 },
  { name: "Sonstiges", order: 11 },
];

// Old name → new name (case-sensitive, exact match).
const RENAMES: Record<string, string> = {
  "Kultur & Kunst": "Kunst & Kultur",
  "Umwelt & Nachhaltigkeit": "Nachhaltigkeit",
  "International & Sprachen": "Internationales",
  "Soziales & Beratung": "Soziales Engagement",
};

async function main() {
  await prisma.$transaction(async (tx) => {
    const before = await tx.category.findMany({ orderBy: { order: "asc" } });
    console.log("\n── BEFORE ──");
    for (const c of before) console.log(`  [${c.order}] ${c.name} (${c.id})`);

    // 1. Rename old categories to new names — but only if the new name doesn't already exist.
    //    If both exist (rename target collides with auto-created dupe), we keep the original ID
    //    and merge the dupe into it below.
    for (const [oldName, newName] of Object.entries(RENAMES)) {
      const original = await tx.category.findFirst({ where: { name: oldName } });
      if (!original) continue;
      const collision = await tx.category.findFirst({ where: { name: newName } });
      if (collision && collision.id !== original.id) {
        // Move groups from collision (auto-created dupe) into original, then rename original.
        const moved = await tx.group.updateMany({
          where: { categoryId: collision.id },
          data: { categoryId: original.id },
        });
        await tx.category.delete({ where: { id: collision.id } });
        console.log(`  merged dupe "${newName}" (${moved.count} groups) → into "${oldName}" before rename`);
      }
      await tx.category.update({ where: { id: original.id }, data: { name: newName } });
      console.log(`  renamed "${oldName}" → "${newName}"`);
    }

    // 2. Ensure all target categories exist with correct order.
    for (const { name, order } of TARGET) {
      const existing = await tx.category.findFirst({ where: { name } });
      if (existing) {
        if (existing.order !== order) {
          await tx.category.update({ where: { id: existing.id }, data: { order } });
          console.log(`  reordered "${name}" → ${order}`);
        }
      } else {
        await tx.category.create({ data: { name, order } });
        console.log(`  created "${name}" (order ${order})`);
      }
    }

    // 3. Delete any remaining categories not in TARGET that have zero groups.
    const targetNames = new Set(TARGET.map((c) => c.name));
    const stray = await tx.category.findMany({
      where: { name: { notIn: Array.from(targetNames) } },
      include: { _count: { select: { groups: true } } },
    });
    for (const c of stray) {
      if (c._count.groups === 0) {
        await tx.category.delete({ where: { id: c.id } });
        console.log(`  deleted empty stray "${c.name}"`);
      } else {
        console.warn(`  ⚠ kept stray "${c.name}" (${c._count.groups} groups still assigned — manual fix needed)`);
      }
    }

    const after = await tx.category.findMany({ orderBy: { order: "asc" } });
    console.log("\n── AFTER ──");
    for (const c of after) console.log(`  [${c.order}] ${c.name} (${c.id})`);

    const groupCounts = await tx.group.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    });
    console.log("\n── Group distribution ──");
    for (const c of after) {
      const n = groupCounts.find((g) => g.categoryId === c.id)?._count._all ?? 0;
      console.log(`  ${n.toString().padStart(3)}  ${c.name}`);
    }
  });

  console.log("\n✅ Migration complete.");
}

main()
  .catch((e) => {
    console.error("\n❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
