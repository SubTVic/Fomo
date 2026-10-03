// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end for WP-4.4: groups edit/clear fields incl. long description, the
// done page explains when changes go live, admins edit answers/filters, slug
// changes need confirmation, merge keeps contacts, destructive imports are gone.
// Needs a running app and a LOCAL database (DATABASE_URL) with the seed data.

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient, RegistrationStatus } from "@prisma/client";

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

async function editLinkFor(page: Page, groupId: string): Promise<string> {
  const res = await page.request.post(`/api/admin/groups/${groupId}/edit-link`, { data: {} });
  expect(res.status()).toBe(200);
  return (await res.json()).link as string;
}

async function groupAt(skip: number) {
  return db.group.findFirstOrThrow({ orderBy: { name: "asc" }, skip });
}

test("group sets long description and clears its website; done page explains go-live", async ({ page }) => {
  const group = await db.group.update({
    where: { id: (await groupAt(5)).id },
    data: {
      isVerified: true,
      registrationStatus: RegistrationStatus.VERIFIED,
      websiteUrl: "https://alt.example.org",
      longDescription: null,
    },
  });
  await db.groupSelfRating.deleteMany({ where: { groupId: group.id } });
  await db.groupSelfRating.create({
    data: {
      groupId: group.id,
      token: "seed",
      filterSelections: [],
      answers: { create: ITEM_IDS.map((itemId) => ({ itemId, value: 0 })) },
    },
  });
  await loginAsAdmin(page);
  const link = await editLinkFor(page, group.id);

  await page.goto(link);
  await page.getByRole("button", { name: "Nur Gruppeninfos ändern →" }).click();
  await page.getByLabel("Ausführliche Beschreibung").fill("Wir treffen uns jeden Mittwoch im Hörsaalzentrum.");
  await page.locator('label:text-is("Website") + input').fill("");
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("button", { name: "Profil speichern" }).click();

  await expect(page.getByText("sobald das FOMO-Team die Website das nächste Mal aktualisiert")).toBeVisible();
  await expect(page.getByRole("link", { name: "Zu fomo-dresden.app" })).toHaveAttribute(
    "href",
    "https://www.fomo-dresden.app",
  );

  const updated = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  expect(updated.longDescription).toBe("Wir treffen uns jeden Mittwoch im Hörsaalzentrum.");
  expect(updated.websiteUrl).toBeNull();
  expect(updated.isVerified).toBe(true);
});

test("admin edits answers and filters; the change is logged", async ({ page }) => {
  const group = await groupAt(5);
  await loginAsAdmin(page);
  await page.goto(`/admin/groups/${group.id}`);
  await page.getByLabel("Antwort WS2-03").selectOption("1");
  await page.getByLabel("Musik machen").check();
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await expect(page.getByText("Profil gespeichert (steht im Änderungsprotokoll).")).toBeVisible();

  const rating = await db.groupSelfRating.findUniqueOrThrow({
    where: { groupId: group.id },
    include: { answers: true },
  });
  expect(rating.answers.find((a) => a.itemId === "WS2-03")?.value).toBe(1);
  expect(rating.filterSelections).toContain("music");
  const log = await db.groupChangeLog.findFirstOrThrow({
    where: { groupId: group.id, source: "admin" },
    orderBy: { createdAt: "desc" },
  });
  expect(Object.keys(log.changes as object)).toContain("selfRating.answers.WS2-03");
  expect(log.reviewedByEmail).toBe("admin@fomo.dev");
});

test("slug changes need an explicit confirmation", async ({ page }) => {
  const group = await groupAt(6);
  await loginAsAdmin(page);

  // Without confirmation the API refuses.
  const full = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  const payload = {
    name: full.name,
    slug: `${full.slug}-neu`,
    shortDescription: full.shortDescription,
    categoryId: full.categoryId,
    career: full.career, tech: full.tech, socialImpact: full.socialImpact, party: full.party,
    religion: full.religion, sports: full.sports, networking: full.networking, arts: full.arts,
    music: full.music, timeLow: full.timeLow, handsOn: full.handsOn, outdoor: full.outdoor,
    international: full.international, beginnerFriendly: full.beginnerFriendly,
    competitive: full.competitive, financialCost: full.financialCost,
    leadershipOpportunities: full.leadershipOpportunities,
  };
  const refused = await page.request.put(`/api/admin/groups/${group.id}`, { data: payload });
  expect(refused.status()).toBe(409);
  expect((await db.group.findUniqueOrThrow({ where: { id: group.id } })).slug).toBe(full.slug);

  // In the form: warning text, then a confirm dialog.
  await page.goto(`/admin/groups/${group.id}`);
  await page.locator('label:text-is("Slug") + input').fill(`${full.slug}-neu`);
  await expect(page.getByText("Achtung: Ein neuer Slug bricht Logo-Zuordnung")).toBeVisible();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  expect((await db.group.findUniqueOrThrow({ where: { id: group.id } })).slug).toBe(full.slug);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Gruppe gespeichert.")).toBeVisible();
  expect((await db.group.findUniqueOrThrow({ where: { id: group.id } })).slug).toBe(`${full.slug}-neu`);
  await db.group.update({ where: { id: group.id }, data: { slug: full.slug } });
});

test("merge moves contacts and edit links to the target", async ({ page }) => {
  const target = await groupAt(0);
  const source = await db.group.create({
    data: {
      name: `${target.name} (Duplikat)`,
      slug: `${target.slug}-duplikat-e2e`,
      shortDescription: "Selbstregistrierte Kopie für den Test.",
      categoryId: target.categoryId,
      registeredVia: "survey",
      contacts: {
        create: { name: "Test Person", email: "kontakt@example.org", source: "self-registration" },
      },
    },
  });
  await loginAsAdmin(page);
  await editLinkFor(page, source.id);

  const res = await page.request.post(`/api/admin/groups/${source.id}/merge`, {
    data: { targetGroupId: target.id },
  });
  expect(res.status()).toBe(200);
  expect(await db.group.findUnique({ where: { id: source.id } })).toBeNull();
  const contacts = await db.groupContact.findMany({ where: { groupId: target.id } });
  expect(contacts.map((c) => c.email)).toContain("kontakt@example.org");
  expect(await db.groupEditToken.count({ where: { groupId: target.id } })).toBeGreaterThan(0);
});

test("destructive import endpoints are gone; list shows the profile column", async ({ page }) => {
  await loginAsAdmin(page);
  expect((await page.request.post("/api/admin/import-groups")).status()).toBe(404);
  // Now falls through to /api/admin/groups/[id], which has no POST handler.
  const scraper = await page.request.post("/api/admin/groups/scraper-import", { data: {} });
  expect([404, 405]).toContain(scraper.status());

  await page.goto("/admin/groups");
  await expect(page.getByRole("button", { name: /CSV neu importieren/ })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Profil" })).toBeVisible();
  await expect(page.getByText("echt").first()).toBeVisible();
});
