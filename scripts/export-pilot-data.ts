// SPDX-License-Identifier: AGPL-3.0-only
// Exports all pilot sessions + answers from DB to JSON, then optionally deletes them.
// Run this BEFORE import-working-set.ts.
// Usage:
//   npx tsx scripts/export-pilot-data.ts          # export only
//   npx tsx scripts/export-pilot-data.ts --delete  # export + delete pilot data from DB

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DELETE = process.argv.includes("--delete");

async function main() {
  const sessions = await prisma.pilotSession.findMany({
    include: { answers: true },
    orderBy: { startedAt: "asc" },
  });

  console.log(`Found ${sessions.length} pilot sessions in DB`);

  const archivePath = path.resolve(
    process.cwd(),
    "data/archives/pilot-responses-2026-05-04.json"
  );

  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  fs.writeFileSync(archivePath, JSON.stringify(sessions, null, 2), "utf-8");
  console.log(`Exported to ${archivePath}`);

  if (!DELETE) {
    console.log("\nRun with --delete to also remove pilot data from DB.");
    return;
  }

  console.log("\n⚠️  Deleting all PilotAnswer + PilotSession records...");
  const deletedAnswers = await prisma.pilotAnswer.deleteMany({});
  const deletedSessions = await prisma.pilotSession.deleteMany({});
  console.log(`Deleted ${deletedAnswers.count} answers, ${deletedSessions.count} sessions`);
  console.log("DB is clean. Run import-working-set.ts next.");
}

main()
  .catch((e) => {
    console.error("Export failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
