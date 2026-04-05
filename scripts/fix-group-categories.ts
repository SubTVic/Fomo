// SPDX-License-Identifier: AGPL-3.0-only
// Fix: reassign group categories based on their boolean attributes.
// Usage: npx tsx scripts/fix-group-categories.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface GroupAttrs {
  arts: boolean;
  music: boolean;
  sports: boolean;
  outdoor: boolean;
  tech: boolean;
  international: boolean;
  socialImpact: boolean;
  religion: boolean;
  competitive: boolean;
}

function determineCategoryName(attrs: GroupAttrs): string {
  // Priority order — most specific first
  if (attrs.arts || attrs.music) return "Kultur & Kunst";
  if (attrs.sports) return "Sport & Bewegung";
  if (attrs.tech) return "Technik & Wissenschaft";
  if (attrs.international) return "International & Sprachen";
  if (attrs.socialImpact && attrs.outdoor) return "Umwelt & Nachhaltigkeit";
  if (attrs.socialImpact) return "Soziales & Beratung";
  return "Politik & Gesellschaft";
}

async function main() {
  const categories = await prisma.category.findMany();
  const catByName = new Map(categories.map((c) => [c.name, c.id]));

  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      categoryId: true,
      arts: true,
      music: true,
      sports: true,
      outdoor: true,
      tech: true,
      international: true,
      socialImpact: true,
      religion: true,
      competitive: true,
    },
  });

  let updated = 0;
  let unchanged = 0;

  for (const group of groups) {
    const bestCategory = determineCategoryName(group);
    const newCategoryId = catByName.get(bestCategory);

    if (!newCategoryId) {
      console.warn(`⚠️  Kategorie "${bestCategory}" nicht gefunden — überspringe ${group.name}`);
      continue;
    }

    if (group.categoryId !== newCategoryId) {
      await prisma.group.update({
        where: { id: group.id },
        data: { categoryId: newCategoryId },
      });
      console.log(`  ${group.name} → ${bestCategory}`);
      updated++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ ${updated} Gruppen umkategorisiert, ${unchanged} unverändert`);
}

main()
  .catch((e) => { console.error("❌ Fehler:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
