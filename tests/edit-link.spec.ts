// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end: reusable edit links (WP-4.2). An admin creates a link, the group
// uses it twice, the admin revokes it, the link then shows a clear error.
// Needs a running app and a LOCAL database (DATABASE_URL) with the seed data.

import { test, expect, type Page } from "@playwright/test";
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

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', "admin@fomo.dev");
  await page.fill('input[name="password"]', "fomo-dev-2026!");
  await page.getByText("Anmelden").click();
  await expect(page).toHaveURL(/\/admin$/);
}

function infoInput(page: Page, label: string) {
  return page.locator(`label:text-is("${label}") + input`);
}

/** Open the link, jump straight to the info step, change one field, submit. */
async function editInfoOnly(page: Page, link: string, label: string, value: string) {
  await page.goto(link);
  await page.getByRole("button", { name: "Nur Gruppeninfos ändern →" }).click();
  await expect(page.getByRole("heading", { name: "Gruppeninfo" })).toBeVisible();
  await infoInput(page, label).fill(value);
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await expect(page.getByRole("heading", { name: "Profil gespeichert!" })).toBeVisible();
}

test("one edit link works for two edits, can be revoked, stores no plaintext", async ({ page }) => {
  const group = await db.group.findFirstOrThrow({ orderBy: { name: "asc" }, skip: 3 });
  await db.groupEditToken.deleteMany({ where: { groupId: group.id } });
  await db.groupSelfRating.deleteMany({ where: { groupId: group.id } });
  await db.groupSelfRating.create({
    data: {
      groupId: group.id,
      token: "seed",
      filterSelections: ["music"],
      answers: { create: ITEM_IDS.map((itemId) => ({ itemId, value: 1 })) },
    },
  });

  // Admin creates the link in the group list (shown once).
  await loginAsAdmin(page);
  await page.goto("/admin/groups");
  const row = page.locator("tr", { hasText: group.name }).first();
  await row.getByRole("button", { name: "Bearbeitungslink" }).click();
  await row.getByRole("button", { name: "Link erzeugen" }).click();
  const linkField = row.getByLabel("Bearbeitungslink");
  await expect(linkField).toBeVisible();
  const link = await linkField.inputValue();
  expect(link).toMatch(/\/gruppe\/bearbeiten\?token=[A-Za-z0-9_-]{43}$/);
  const token = new URL(link).searchParams.get("token")!;

  // Only the hash is stored.
  const stored = await db.groupEditToken.findMany({ where: { groupId: group.id } });
  expect(stored).toHaveLength(1);
  expect(stored[0].tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
  expect(await db.groupEditToken.count({ where: { tokenHash: token } })).toBe(0);

  // Two consecutive edits with the same link.
  await editInfoOnly(page, link, "Mitgliederzahl", "41");
  await editInfoOnly(page, link, "Mitgliederzahl", "42");
  const afterEdits = await db.group.findUniqueOrThrow({
    where: { id: group.id },
    include: { selfRating: { include: { answers: true } } },
  });
  expect(afterEdits.memberCount).toBe(42);
  // "Only change group info" kept the answers and filters.
  expect(afterEdits.selfRating?.answers.every((a) => a.value === 1)).toBe(true);
  expect(afterEdits.selfRating?.filterSelections).toEqual(["music"]);
  expect(afterEdits.selfRating?.token).toBe(`edit-token:${stored[0].id}`);
  const used = await db.groupEditToken.findUniqueOrThrow({ where: { id: stored[0].id } });
  expect(used.lastUsedAt).not.toBeNull();

  // Admin revokes all links → the link shows a clear error with a contact.
  await page.goto("/admin/groups");
  const row2 = page.locator("tr", { hasText: group.name }).first();
  await row2.getByRole("button", { name: "Bearbeitungslink" }).click();
  page.once("dialog", (d) => d.accept());
  await row2.getByRole("button", { name: "Alle zurückziehen" }).click();
  await expect(row2.getByText("1 Link(s) zurückgezogen.")).toBeVisible();

  await page.goto(link);
  await expect(page.getByText("wurde zurückgezogen")).toBeVisible();
  await expect(page.getByText("fomo@yeti-dresden.org")).toBeVisible();
  const rejected = await page.request.post("/api/groups/register-attributes", {
    data: { token, shortDescription: "Darf nicht gespeichert werden." },
  });
  expect(rejected.status()).toBe(410);
});

test("legacy one-time invite links keep working once", async ({ page }) => {
  const group = await db.group.findFirstOrThrow({ orderBy: { name: "asc" }, skip: 4 });
  const token = randomBytes(16).toString("hex");
  await db.groupInvite.create({
    data: { token, groupId: group.id, expiresAt: new Date(Date.now() + 86_400_000) },
  });

  const first = await page.request.post("/api/groups/register-attributes", {
    data: { token, memberCount: 7 },
  });
  expect(first.status()).toBe(200);
  const second = await page.request.post("/api/groups/register-attributes", {
    data: { token, memberCount: 8 },
  });
  expect(second.status()).toBe(409);
  expect((await db.group.findUniqueOrThrow({ where: { id: group.id } })).memberCount).toBe(7);
});
