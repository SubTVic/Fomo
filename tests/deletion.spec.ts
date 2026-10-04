// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end for WP-5.5: admins delete single contacts; the cleanup deletes
// dead edit links, old invites and old failed logins, and nothing else.
// Needs a running app and a LOCAL database (DATABASE_URL) with the seed data.

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { deleteExpiredData } from "../src/lib/cleanup";

const db = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const suffix = Date.now().toString(36);
const EDITOR_EMAIL = `deletion-editor-${suffix}@fomo.dev`;
const PASSWORD = "e2e-deletion-password!";

test.describe.configure({ mode: "serial" });
test.use({ locale: "de-DE" });
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

test.afterAll(async () => {
  await db.admin.deleteMany({ where: { email: EDITOR_EMAIL } });
  await db.$disconnect();
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByText("Anmelden").click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("super admin deletes a single contact; editors cannot", async ({ page, browser }) => {
  const group = await db.group.findFirstOrThrow({ orderBy: { name: "asc" } });
  const [keep, remove] = await Promise.all([
    db.groupContact.create({ data: { groupId: group.id, name: `Bleibt ${suffix}`, email: `keep-${suffix}@example.org`, source: "admin" } }),
    db.groupContact.create({ data: { groupId: group.id, name: `Weg ${suffix}`, email: `remove-${suffix}@example.org`, source: "admin" } }),
  ]);

  // Editor: no button, API refuses.
  await db.admin.create({ data: { email: EDITOR_EMAIL, passwordHash: await hash(PASSWORD, 12), role: "EDITOR" } });
  const editorContext = await browser.newContext();
  const editor = await editorContext.newPage();
  await login(editor, EDITOR_EMAIL, PASSWORD);
  await editor.goto("/admin/contacts");
  await expect(editor.getByText(`Weg ${suffix}`)).toBeVisible();
  await expect(editor.getByRole("button", { name: `Kontakt Weg ${suffix} löschen` })).toHaveCount(0);
  expect((await editor.request.delete(`/api/admin/contacts/${remove.id}`)).status()).toBe(403);
  await editorContext.close();

  // Super admin: delete via the list.
  await login(page, "admin@fomo.dev", "fomo-dev-2026!");
  await page.goto("/admin/contacts");
  await page.getByRole("button", { name: `Kontakt Weg ${suffix} löschen` }).click();
  await page.getByRole("button", { name: "Ja" }).click();
  await expect(page.getByText(`Weg ${suffix}`)).toHaveCount(0);
  expect(await db.groupContact.count({ where: { id: remove.id } })).toBe(0);
  expect(await db.groupContact.count({ where: { id: keep.id } })).toBe(1);
  expect((await page.request.delete(`/api/admin/contacts/${remove.id}`)).status()).toBe(404);

  await db.groupContact.delete({ where: { id: keep.id } });
});

test("cleanup deletes dead links and old failed logins, nothing else", async () => {
  const group = await db.group.findFirstOrThrow({ orderBy: { name: "asc" } });
  const ago = (days: number) => new Date(Date.now() - days * DAY);
  const ahead = (days: number) => new Date(Date.now() + days * DAY);
  const tag = (name: string) => `cleanup-${suffix}-${name}`;

  const tokens = {
    active: { expiresAt: ahead(300) },
    recentlyRevoked: { expiresAt: ahead(300), revokedAt: ago(5) },
    longRevoked: { expiresAt: ahead(300), revokedAt: ago(40) },
    recentlyExpired: { expiresAt: ago(5) },
    longExpired: { expiresAt: ago(40) },
  };
  for (const [name, data] of Object.entries(tokens)) {
    await db.groupEditToken.create({ data: { groupId: group.id, tokenHash: tag(name), ...data } });
  }
  const invites = {
    open: { expiresAt: ahead(10) },
    recentlyUsed: { expiresAt: ahead(10), usedAt: ago(5) },
    longUsed: { expiresAt: ahead(10), usedAt: ago(40) },
    longExpired: { expiresAt: ago(40) },
  };
  for (const [name, data] of Object.entries(invites)) {
    await db.groupInvite.create({ data: { groupId: group.id, token: tag(name), ...data } });
  }
  await db.loginAttempt.createMany({
    data: [
      { emailHash: tag("recent"), createdAt: ago(0.5) },
      { emailHash: tag("old"), createdAt: ago(2) },
    ],
  });
  const contactsBefore = await db.groupContact.count();
  const groupsBefore = await db.group.count();

  const deleted = await deleteExpiredData(db);
  expect(deleted.editTokens).toBeGreaterThanOrEqual(2);
  expect(deleted.invites).toBeGreaterThanOrEqual(2);
  expect(deleted.loginAttempts).toBeGreaterThanOrEqual(1);

  const left = async (model: "token" | "invite" | "login") => {
    const rows =
      model === "token"
        ? await db.groupEditToken.findMany({ where: { tokenHash: { startsWith: tag("") } }, select: { tokenHash: true } })
        : model === "invite"
          ? await db.groupInvite.findMany({ where: { token: { startsWith: tag("") } }, select: { token: true } })
          : await db.loginAttempt.findMany({ where: { emailHash: { startsWith: tag("") } }, select: { emailHash: true } });
    return rows.map((r) => Object.values(r)[0].replace(tag(""), "")).sort();
  };
  expect(await left("token")).toEqual(["active", "recentlyExpired", "recentlyRevoked"]);
  expect(await left("invite")).toEqual(["open", "recentlyUsed"]);
  expect(await left("login")).toEqual(["recent"]);
  expect(await db.groupContact.count()).toBe(contactsBefore);
  expect(await db.group.count()).toBe(groupsBefore);

  await db.groupEditToken.deleteMany({ where: { tokenHash: { startsWith: tag("") } } });
  await db.groupInvite.deleteMany({ where: { token: { startsWith: tag("") } } });
  await db.loginAttempt.deleteMany({ where: { emailHash: { startsWith: tag("") } } });
});
