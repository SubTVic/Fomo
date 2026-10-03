// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end: a verified group corrects its data via edit link → it stays
// verified, the export keeps its real profile, the change shows up under
// "Änderungen" and can be reverted. Needs a running app and a LOCAL database
// (DATABASE_URL) with the seed data (`npx prisma db seed`).

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient, RegistrationStatus } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

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

async function createEditLink(page: Page, groupId: string): Promise<string> {
  const res = await page.request.post("/api/admin/groups/invites", {
    data: { invites: [{ groupId }] },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).invites[0].token as string;
}

/** Put a seed group into the state "verified, with a real self-rating (all neutral)". */
async function makeVerifiedGroup(skip: number) {
  const group = await db.group.findFirstOrThrow({ orderBy: { name: "asc" }, skip });
  await db.groupSelfRating.deleteMany({ where: { groupId: group.id } });
  await db.groupChangeLog.deleteMany({ where: { groupId: group.id } });
  await db.groupSelfRating.create({
    data: {
      groupId: group.id,
      token: "seed",
      filterSelections: [],
      answers: { create: ITEM_IDS.map((itemId) => ({ itemId, value: 0 })) },
    },
  });
  return db.group.update({
    where: { id: group.id },
    data: {
      isVerified: true,
      registrationStatus: RegistrationStatus.VERIFIED,
      shortDescription: "Kurzbeschreibung vor der Korrektur.",
    },
  });
}

test("verified group stays verified after an edit; change can be reverted", async ({ page }) => {
  const group = await makeVerifiedGroup(1);
  await loginAsAdmin(page);
  const token = await createEditLink(page, group.id);

  // The group submits a correction: new description, two answers changed.
  const submit = await page.request.post("/api/groups/register-attributes", {
    data: {
      token,
      shortDescription: "Kurzbeschreibung nach der Korrektur.",
      ws2Answers: ITEM_IDS.map((itemId) => ({
        itemId,
        value: itemId === "WS2-01" ? 1 : itemId === "WS2-02" ? -1 : 0,
      })),
      ws2FilterSelections: [],
      raterCount: 1,
    },
  });
  expect(submit.status()).toBe(200);

  const afterEdit = await db.group.findUniqueOrThrow({
    where: { id: group.id },
    include: { selfRating: { include: { answers: true } } },
  });
  expect(afterEdit.isVerified).toBe(true);
  expect(afterEdit.registrationStatus).toBe(RegistrationStatus.VERIFIED);
  expect(afterEdit.shortDescription).toBe("Kurzbeschreibung nach der Korrektur.");
  const answer = (id: string) => afterEdit.selfRating?.answers.find((a) => a.itemId === id)?.value;
  expect(answer("WS2-01")).toBe(1);
  expect(answer("WS2-02")).toBe(-1);

  const logs = await db.groupChangeLog.findMany({ where: { groupId: group.id } });
  expect(logs).toHaveLength(1);
  expect(logs[0].source).toBe("edit-link");
  expect(logs[0].reviewedAt).toBeNull();
  expect(Object.keys(logs[0].changes as object).sort()).toEqual([
    "selfRating.answers.WS2-01",
    "selfRating.answers.WS2-02",
    "shortDescription",
  ]);

  // The export keeps the real profile (derived: false) with the new answers.
  const backup = await page.request.get("/api/admin/backup");
  expect(backup.status()).toBe(200);
  const dir = mkdtempSync(path.join(tmpdir(), "fomo-e2e-"));
  try {
    const input = path.join(dir, "export-input.json");
    const output = path.join(dir, "groups.json");
    writeFileSync(input, await backup.text());
    execFileSync("node", [
      "static-site/scripts/export-from-backup.mjs",
      "--backup", input,
      "--quiz", "static-site/data/quiz.json",
      "--out", output,
    ], { stdio: "ignore" });
    const exported = JSON.parse(readFileSync(output, "utf8"));
    const entry = exported.groups.find((g: { slug: string }) => g.slug === group.slug);
    expect(entry.selfRating.derived).toBe(false);
    const exportedValue = (id: string) =>
      entry.selfRating.answers.find((a: { itemId: string }) => a.itemId === id)?.value;
    expect(exportedValue("WS2-01")).toBe(1);
    expect(exportedValue("WS2-02")).toBe(-1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // Admin sees the change and reverts it.
  await page.goto("/admin/aenderungen");
  const card = page.locator("li", { hasText: group.name }).first();
  await expect(card.getByText("Kurzbeschreibung", { exact: true })).toBeVisible();
  await expect(card.getByText("Antwort WS2-01")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  const revert = page.waitForResponse((r) => r.url().includes("/api/admin/changes/"));
  await card.getByRole("button", { name: "Rückgängig" }).click();
  expect((await revert).status()).toBe(200);

  const reverted = await db.group.findUniqueOrThrow({
    where: { id: group.id },
    include: { selfRating: { include: { answers: true } } },
  });
  expect(reverted.shortDescription).toBe("Kurzbeschreibung vor der Korrektur.");
  expect(reverted.isVerified).toBe(true);
  for (const a of reverted.selfRating?.answers ?? []) expect(a.value).toBe(0);

  const after = await db.groupChangeLog.findMany({
    where: { groupId: group.id },
    orderBy: { createdAt: "asc" },
  });
  expect(after.map((l) => l.source)).toEqual(["edit-link", "revert"]);
  expect(after[0].reviewedAt).not.toBeNull();
  expect(after[1].reviewedByEmail).toBe("admin@fomo.dev");
});

test("unverified group still needs a review after an edit", async ({ page }) => {
  const group = await db.group.update({
    where: { id: (await db.group.findFirstOrThrow({ orderBy: { name: "asc" }, skip: 2 })).id },
    data: { isVerified: false, registrationStatus: RegistrationStatus.INVITED },
  });
  await loginAsAdmin(page);
  const token = await createEditLink(page, group.id);
  const submit = await page.request.post("/api/groups/register-attributes", {
    data: { token, shortDescription: "Neue Beschreibung einer unbestätigten Gruppe." },
  });
  expect(submit.status()).toBe(200);
  const updated = await db.group.findUniqueOrThrow({ where: { id: group.id } });
  expect(updated.isVerified).toBe(false);
  expect(updated.registrationStatus).toBe(RegistrationStatus.SUBMITTED);
});
