// SPDX-License-Identifier: AGPL-3.0-only
//
// Build static-site/data/groups.json directly from a database. The logic lives
// in src/lib/export/static-groups.ts (shared with the export API route used by
// the "Daten-Sync" GitHub workflow, WP-4.5).
//
// Usage (a person with DB access; never run by the AI against production):
//   DATABASE_URL="<url>" npx tsx scripts/export-static-site-groups.ts [--out <file>]
//
// The static site then needs a rebuild (next build) for the change to land.

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { buildStaticGroups, staticGroupsQuery, type QuizShape } from "../src/lib/export/static-groups";

const REPO_ROOT = path.resolve(__dirname, "..");
const QUIZ_PATH = path.join(REPO_ROOT, "static-site/data/quiz.json");

function outPath(): string {
  const i = process.argv.indexOf("--out");
  return i > -1 && process.argv[i + 1]
    ? path.resolve(process.argv[i + 1])
    : path.join(REPO_ROOT, "static-site/data/groups.json");
}

async function main() {
  const quiz = JSON.parse(readFileSync(QUIZ_PATH, "utf8")) as QuizShape;
  const db = new PrismaClient();
  try {
    const groups = await db.group.findMany(staticGroupsQuery);
    const output = buildStaticGroups(groups, quiz, { source: "database via export-static-site-groups.ts" });
    const out = outPath();
    writeFileSync(out, JSON.stringify(output, null, 2) + "\n");
    console.log(`✅ wrote ${output._meta.groupCount} groups → ${path.relative(process.cwd(), out)}`);
    console.log(`   • ${output._meta.verifiedCount} verified (real selfRating)`);
    console.log(`   • ${output._meta.derivedCount} unverified (derived selfRating)`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n❌ Export failed:", e);
  process.exit(1);
});
