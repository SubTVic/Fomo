// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end: a group adds a community link (e.g. WhatsApp group) with its own
// name via its edit link; it is stored normalized, logged, and invalid links
// are rejected. Needs a running app and a LOCAL database with the seed data.

import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const db = new PrismaClient();

test.describe.configure({ mode: "serial" });
test.use({ locale: "de-DE" });
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

test.afterAll(async () => {
  await db.$disconnect();
});

const ITEM_IDS = Array.from({ length: 21 }, (_, i) => `WS2-${String(i + 1).padStart(2, "0")}`);

test("a group sets and removes its community link via the edit link", async ({ page }) => {
  const group = await db.group.findFirstOrThrow({ orderBy: { name: "asc" }, skip: 2 });
  await db.group.update({ where: { id: group.id }, data: { communityLinkUrl: null, communityLinkLabel: null } });
  // Existing answers unlock "Nur Gruppeninfos ändern".
  await db.groupSelfRating.deleteMany({ where: { groupId: group.id } });
  await db.groupSelfRating.create({
    data: {
      groupId: group.id,
      token: "seed",
      filterSelections: [],
      answers: { create: ITEM_IDS.map((itemId) => ({ itemId, value: 0 })) },
    },
  });
  const token = randomBytes(24).toString("base64url");
  await db.groupEditToken.create({
    data: {
      groupId: group.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });

  await page.goto(`/gruppe/bearbeiten?token=${encodeURIComponent(token)}`);
  await page.getByRole("button", { name: "Nur Gruppeninfos ändern →" }).click();
  await page.getByRole("textbox", { name: "Community-Link" }).fill("chat.whatsapp.com/abc123");
  await page.getByLabel("Name des Links").fill("WhatsApp-Gruppe");
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await expect(page.getByRole("heading", { name: "Profil gespeichert!" })).toBeVisible();

  const saved = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  expect(saved.communityLinkUrl).toBe("https://chat.whatsapp.com/abc123");
  expect(saved.communityLinkLabel).toBe("WhatsApp-Gruppe");
  const log = await db.groupChangeLog.findFirstOrThrow({
    where: { groupId: group.id },
    orderBy: { createdAt: "desc" },
  });
  expect(log.changes).toMatchObject({
    communityLinkUrl: { from: null, to: "https://chat.whatsapp.com/abc123" },
    communityLinkLabel: { from: null, to: "WhatsApp-Gruppe" },
  });

  // Invalid links are rejected and nothing changes.
  const bad = await page.request.post("/api/groups/register-attributes", {
    data: { token, communityLinkUrl: "javascript:alert(1)", communityLinkLabel: "Böse" },
  });
  expect(bad.status()).toBe(422);
  const tooLong = await page.request.post("/api/groups/register-attributes", {
    data: { token, communityLinkUrl: "https://discord.gg/x", communityLinkLabel: "x".repeat(41) },
  });
  expect(tooLong.status()).toBe(422);
  expect((await db.group.findUniqueOrThrow({ where: { id: group.id } })).communityLinkUrl).toBe(
    "https://chat.whatsapp.com/abc123",
  );

  // The form shows the stored values; clearing the link also clears the name.
  await page.goto(`/gruppe/bearbeiten?token=${encodeURIComponent(token)}`);
  await page.getByRole("button", { name: "Nur Gruppeninfos ändern →" }).click();
  await expect(page.getByLabel("Name des Links")).toHaveValue("WhatsApp-Gruppe");
  await page.getByRole("textbox", { name: "Community-Link" }).fill("");
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await expect(page.getByRole("heading", { name: "Profil gespeichert!" })).toBeVisible();
  const cleared = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  expect(cleared.communityLinkUrl).toBeNull();
  expect(cleared.communityLinkLabel).toBeNull();
});
