// SPDX-License-Identifier: AGPL-3.0-only
//
// Delete data that is no longer needed (Löschkonzept, Umsetzungsplan WP-5.5):
// expired/revoked edit links, used/expired legacy invites, old failed logins.
// What and why: docs/datenschutz-loeschkonzept.md. Logic: src/lib/cleanup.ts.
//
// Usage (a person with DB access; later a daily cron job on the server):
//   DATABASE_URL="<url>" npx tsx scripts/cleanup.ts            # dry run: only counts
//   DATABASE_URL="<url>" npx tsx scripts/cleanup.ts --apply    # deletes

import { PrismaClient } from "@prisma/client";
import { countExpiredData, deleteExpiredData, type CleanupCounts } from "../src/lib/cleanup";

function format(counts: CleanupCounts): string {
  return [
    `  Bearbeitungslinks (abgelaufen/widerrufen): ${counts.editTokens}`,
    `  Alte Einladungen (benutzt/abgelaufen):     ${counts.invites}`,
    `  Fehlgeschlagene Logins:                    ${counts.loginAttempts}`,
  ].join("\n");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient();
  try {
    if (apply) {
      const deleted = await deleteExpiredData(db);
      console.log(`Gelöscht (${new Date().toISOString()}):\n${format(deleted)}`);
    } else {
      const wouldDelete = await countExpiredData(db);
      console.log(`Probelauf – würde löschen:\n${format(wouldDelete)}\nZum Löschen: --apply`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
