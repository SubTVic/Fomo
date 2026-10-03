// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end for WP-5.4: login is case-insensitive and locked after repeated
// failures; editors can edit but not delete, merge, back up or manage admins.
// Needs a running app and a LOCAL database (DATABASE_URL) with the seed data.

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { hashLoginEmail } from "../src/lib/login-guard";

const db = new PrismaClient();
const PASSWORD = "e2e-roles-password!";
const suffix = Date.now().toString(36);
const LOCK_EMAIL = `lock-${suffix}@fomo.dev`;
const EDITOR_EMAIL = `editor-${suffix}@fomo.dev`;

test.describe.configure({ mode: "serial" });
test.use({ locale: "de-DE" });
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

test.beforeAll(async () => {
  const passwordHash = await hash(PASSWORD, 12);
  await db.admin.createMany({
    data: [
      { email: LOCK_EMAIL, passwordHash, role: "EDITOR" },
      { email: EDITOR_EMAIL, passwordHash, role: "EDITOR" },
    ],
  });
});

test.afterAll(async () => {
  await db.loginAttempt.deleteMany({
    where: { emailHash: { in: [hashLoginEmail(LOCK_EMAIL), hashLoginEmail(EDITOR_EMAIL)] } },
  });
  await db.admin.deleteMany({ where: { email: { in: [LOCK_EMAIL, EDITOR_EMAIL] } } });
  await db.$disconnect();
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByText("Anmelden").click();
}

test("login ignores the letter case of the e-mail address", async ({ page }) => {
  await login(page, EDITOR_EMAIL.toUpperCase(), PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);
});

test("five failed logins lock the address, also for the right password", async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await login(page, LOCK_EMAIL, "wrong-password-123");
    await expect(page.getByText("E-Mail oder Passwort falsch.")).toBeVisible();
  }
  await login(page, LOCK_EMAIL, PASSWORD);
  await expect(page.getByText("Zu viele Fehlversuche")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);

  // Only hashes are stored, never the typed address.
  const rows = await db.loginAttempt.findMany({ where: { emailHash: hashLoginEmail(LOCK_EMAIL) } });
  expect(rows).toHaveLength(5);

  // Once the lock has expired, the right password works and resets the count.
  await db.loginAttempt.updateMany({
    where: { emailHash: hashLoginEmail(LOCK_EMAIL) },
    data: { createdAt: new Date(Date.now() - 31 * 60 * 1000) },
  });
  await login(page, LOCK_EMAIL, PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);
  expect(await db.loginAttempt.count({ where: { emailHash: hashLoginEmail(LOCK_EMAIL) } })).toBe(0);
});

test("editors edit groups but cannot delete, merge, back up or manage admins", async ({ page }) => {
  await login(page, EDITOR_EMAIL, PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);

  await expect(page.getByRole("link", { name: "Admins" })).toHaveCount(0);
  await expect(page.getByText("Backup herunterladen")).toHaveCount(0);

  const [group, other] = await db.group.findMany({ orderBy: { name: "asc" }, take: 2 });
  expect((await page.request.get("/api/admin/backup")).status()).toBe(403);
  expect((await page.request.delete(`/api/admin/groups/${group.id}`)).status()).toBe(403);
  expect(
    (await page.request.post(`/api/admin/groups/${group.id}/merge`, { data: { targetGroupId: other.id } })).status(),
  ).toBe(403);
  expect((await page.request.get("/api/admin/users")).status()).toBe(403);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/admin$/);
  expect(await db.group.count({ where: { id: group.id } })).toBe(1);

  // Allowed: edit links (and editing, verifying — same guard).
  expect((await page.request.post(`/api/admin/groups/${group.id}/edit-link`, { data: {} })).status()).toBe(200);
  await page.goto("/admin/groups");
  await expect(page.getByRole("heading", { name: /Gruppen/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Löschen/i })).toHaveCount(0);
});
