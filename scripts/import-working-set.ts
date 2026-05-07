// SPDX-License-Identifier: AGPL-3.0-only
// Imports working-set-v1.json into the database as QuizThesis records.
// Run AFTER export-pilot-data.ts (pilot cleanup).
// Usage: npx tsx scripts/import-working-set.ts

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface WorkingSetItem {
  id: string;
  pilotQuestionId: string | null;
  text: string;
  shortTitle: string;
  hint: string | null;
  order: number;
  attributes: Array<{ attribute: string; isInverse: boolean }>;
}

interface WorkingSet {
  _meta: { version: string; frozenAt: string; totalItems: number };
  items: WorkingSetItem[];
}

async function main() {
  const jsonPath = path.resolve(process.cwd(), "data/working-set-v1.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`Not found: ${jsonPath}`);
    process.exit(1);
  }

  const ws: WorkingSet = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Loading Working Set ${ws._meta.version} (${ws._meta.totalItems} items, frozen ${ws._meta.frozenAt})`);

  // Clear existing quiz theses (cascades to QuizThesisAttribute)
  const deleted = await prisma.quizThesis.deleteMany({});
  console.log(`Cleared ${deleted.count} existing QuizThesis records`);

  let created = 0;
  for (const item of ws.items) {
    await prisma.quizThesis.create({
      data: {
        id: item.id,
        text: item.text,
        shortTitle: item.shortTitle,
        hint: item.hint,
        order: item.order,
        isActive: true,
        attributes: {
          create: item.attributes.map((a) => ({
            attribute: a.attribute,
            isInverse: a.isInverse,
          })),
        },
      },
    });
    created++;
    console.log(`  ✓ ${item.id}: ${item.shortTitle}`);
  }

  console.log(`\nDone: ${created} QuizThesis records created`);
  console.log("Live quiz will now show these items on /quiz");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
