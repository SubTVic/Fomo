// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end: an admin creates an edit link, the group changes a few fields
// and the values end up in the database. Needs a running app and a LOCAL
// database (DATABASE_URL) with the seed data (`npx prisma db seed`).

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

test.describe.configure({ mode: "serial" });
// The assertions use the German UI texts.
test.use({ locale: "de-DE" });
// One browser project is enough; the flow itself is not layout-specific.
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

test.afterAll(async () => {
  await db.$disconnect();
});

async function createEditLink(page: Page, groupId: string): Promise<string> {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', "admin@fomo.dev");
  await page.fill('input[name="password"]', "fomo-dev-2026!");
  await page.getByText("Anmelden").click();
  await expect(page).toHaveURL(/\/admin$/);

  const res = await page.request.post("/api/admin/groups/invites", {
    data: { invites: [{ groupId }] },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.invites[0].token as string;
}

/** Click through intro, filter step and all items without changing answers. */
async function goToInfoStep(page: Page, token: string) {
  await page.goto(`/groups/register?token=${token}`);
  await page.getByRole("button", { name: "Jetzt starten" }).click();
  await page.getByRole("button", { name: "Weiter zu den Fragen →" }).click();
  for (;;) {
    const skip = page.getByRole("button", { name: /Überspringen|Antwort behalten/ });
    if (!(await skip.isVisible().catch(() => false))) break;
    await skip.click();
  }
  await expect(page.getByRole("heading", { name: "Gruppeninfo" })).toBeVisible();
}

function infoInput(page: Page, label: string) {
  return page.locator(`label:text-is("${label}") + input`);
}

async function submit(page: Page) {
  await page.getByRole("button", { name: "Weiter →" }).click();
  await page.getByRole("button", { name: "Profil speichern" }).click();
}

test("group changes only member count and contact email → both are saved", async ({ page }) => {
  const group = await db.group.findFirstOrThrow({ where: { isActive: true }, orderBy: { name: "asc" } });
  // Typical legacy data: a website without protocol (used to block the form).
  await db.group.update({
    where: { id: group.id },
    data: { memberCount: 30, contactEmail: "alt@example.org", websiteUrl: "effektiveraltruismus.de" },
  });

  const token = await createEditLink(page, group.id);
  await goToInfoStep(page, token);

  await infoInput(page, "Mitgliederzahl").fill("42");
  await infoInput(page, "Kontakt-E-Mail").fill("neu@example.org");
  await submit(page);
  await expect(page.getByRole("heading", { name: "Profil gespeichert!" })).toBeVisible();

  const saved = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  expect(saved.memberCount).toBe(42);
  expect(saved.contactEmail).toBe("neu@example.org");
  expect(saved.websiteUrl).toBe("https://effektiveraltruismus.de");
});

test("invalid website shows an error at the field; fixed value is saved", async ({ page }) => {
  const group = await db.group.findFirstOrThrow({ where: { isActive: true }, orderBy: { name: "desc" } });
  const token = await createEditLink(page, group.id);
  await goToInfoStep(page, token);

  await infoInput(page, "Website").fill("keine gültige adresse");
  await infoInput(page, "Instagram").fill("@eure.gruppe");
  await submit(page);

  // Back on the info step, with the message next to the website input.
  await expect(page.getByRole("heading", { name: "Gruppeninfo" })).toBeVisible();
  await expect(page.getByText("Bitte gebt eine gültige Web-Adresse an")).toBeVisible();
  await expect(page.getByText("Bitte gebt euren Instagram-Namen")).toHaveCount(0);

  await infoInput(page, "Website").fill("eure-gruppe.de");
  await submit(page);
  await expect(page.getByRole("heading", { name: "Profil gespeichert!" })).toBeVisible();

  const saved = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  expect(saved.websiteUrl).toBe("https://eure-gruppe.de");
  expect(saved.instagramUrl).toBe("https://www.instagram.com/eure.gruppe/");
});

test("previously saved answers are offered as 'keep answer'", async ({ page }) => {
  const rating = await db.groupSelfRating.findFirstOrThrow({ orderBy: { submittedAt: "desc" } });
  const token = await createEditLink(page, rating.groupId);
  await page.goto(`/groups/register?token=${token}`);
  await page.getByRole("button", { name: "Jetzt starten" }).click();
  await page.getByRole("button", { name: "Weiter zu den Fragen →" }).click();
  await expect(page.getByRole("button", { name: "Weiter (Antwort behalten) →" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Überspringen →" })).toHaveCount(0);
});
