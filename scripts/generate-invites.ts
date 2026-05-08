// SPDX-License-Identifier: AGPL-3.0-only
// Liest Fomo mail v1.xml, matched Gruppen in der DB, erstellt Invite-Tokens
// und gibt eine JSON-Liste aus, die zum E-Mail-Versand genutzt wird.
//
// Aufruf: DATABASE_URL="postgresql://..." npx tsx scripts/generate-invites.ts

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import crypto from "crypto";
import path from "path";

const db = new PrismaClient();

// ── 1. XML parsen ──────────────────────────────────────────────────────────

const XML_PATH = path.resolve(
  __dirname,
  "../../../Fomo mail v1.xml"
);

function parseXmlContacts(xml: string): { email: string; groupName: string }[] {
  const rowPattern = /<Row[^>]*>([\s\S]*?)<\/Row>/g;
  const dataPattern = /<Data[^>]*ss:Type="String"[^>]*>([\s\S]*?)<\/Data>/g;
  const contacts: { email: string; groupName: string }[] = [];

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(xml)) !== null) {
    const rowContent = rowMatch[1];
    const cells: string[] = [];
    let dataMatch: RegExpExecArray | null;
    dataPattern.lastIndex = 0;
    while ((dataMatch = dataPattern.exec(rowContent)) !== null) {
      // Strip HTML tags from cell content
      const text = dataMatch[1].replace(/<[^>]+>/g, "").trim();
      if (text) cells.push(text);
    }
    if (cells.length >= 2) {
      const email = cells[0].trim().toLowerCase();
      const groupName = cells[1].trim();
      if (email.includes("@")) {
        contacts.push({ email, groupName });
      }
    }
  }

  // Deduplicate by email
  const seen = new Set<string>();
  return contacts.filter(({ email }) => {
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

// ── 2. Gruppen-Matching ────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findBestMatch(
  targetName: string,
  groups: { id: string; name: string }[]
): { id: string; name: string } | null {
  const target = normalize(targetName);

  // Exact normalized match
  const exact = groups.find((g) => normalize(g.name) === target);
  if (exact) return exact;

  // Substring match
  const sub = groups.find(
    (g) => normalize(g.name).includes(target) || target.includes(normalize(g.name))
  );
  if (sub) return sub;

  return null;
}

// ── 3. Hauptlogik ──────────────────────────────────────────────────────────

const BASE_URL = "https://fomo-pi.vercel.app";
const EXPIRES_DAYS = 30;

async function main() {
  const xml = readFileSync(XML_PATH, "utf-8");
  const contacts = parseXmlContacts(xml);
  console.error(`Parsed ${contacts.length} unique contacts from XML`);

  const allGroups = await db.group.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  console.error(`Found ${allGroups.length} active groups in DB`);

  const results: {
    email: string;
    groupName: string;
    dbGroupName: string | null;
    token: string | null;
    link: string | null;
    status: "ok" | "no_match" | "existing";
  }[] = [];

  for (const { email, groupName } of contacts) {
    const matched = findBestMatch(groupName, allGroups);

    if (!matched) {
      console.error(`  ⚠ No DB match for: ${groupName}`);
      results.push({ email, groupName, dbGroupName: null, token: null, link: null, status: "no_match" });
      continue;
    }

    // Check for existing valid invite
    const existing = await db.groupInvite.findFirst({
      where: {
        groupId: matched.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      console.error(`  ♻ Reusing existing token for: ${matched.name}`);
      results.push({
        email,
        groupName,
        dbGroupName: matched.name,
        token: existing.token,
        link: `${BASE_URL}/groups/register?token=${existing.token}`,
        status: "existing",
      });
      continue;
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRES_DAYS);

    await db.groupInvite.create({
      data: { token, groupId: matched.id, email, expiresAt },
    });

    await db.group.updateMany({
      where: { id: matched.id, registrationStatus: null },
      data: { registrationStatus: "INVITED" },
    });

    console.error(`  ✓ Created token for: ${matched.name}`);
    results.push({
      email,
      groupName,
      dbGroupName: matched.name,
      token,
      link: `${BASE_URL}/groups/register?token=${token}`,
      status: "ok",
    });
  }

  // Output JSON to stdout
  console.log(JSON.stringify(results, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
