// SPDX-License-Identifier: AGPL-3.0-only
// Move all unverified groups to "Sonstiges" so the scraper-default doesn't bias category stats.
// Verified groups keep their (manually confirmed) category.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sonstiges = await prisma.category.findFirst({ where: { name: "Sonstiges" } });
  if (!sonstiges) throw new Error('Category "Sonstiges" not found — run migrate-categories.ts first');

  const before = await prisma.group.groupBy({
    by: ["categoryId", "isVerified"],
    _count: { _all: true },
  });
  console.log("── BEFORE ──");
  console.log(before);

  const result = await prisma.group.updateMany({
    where: { isVerified: false, categoryId: { not: sonstiges.id } },
    data: { categoryId: sonstiges.id },
  });
  console.log(`\n→ moved ${result.count} unverified groups to "Sonstiges"`);

  const after = await prisma.group.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });
  const cats = await prisma.category.findMany({ orderBy: { order: "asc" } });
  console.log("\n── AFTER (by category) ──");
  for (const c of cats) {
    const n = after.find((g) => g.categoryId === c.id)?._count._all ?? 0;
    console.log(`  ${n.toString().padStart(3)}  ${c.name}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
