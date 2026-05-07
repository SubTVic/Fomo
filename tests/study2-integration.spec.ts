// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:3001" });

test.describe("Studie 2 — Admin", () => {
  test("admin/study2 zeigt Sessions, Sidebar-Link, CSV+JSON Export", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', "admin@fomo.dev");
    await page.fill('input[name="password"]', "fomo-dev-2026!");
    await page.getByText("Anmelden").click();
    await page.waitForURL(/\/admin$/, { timeout: 15_000 });

    // Sidebar link
    await expect(page.getByRole("link", { name: "Studie 2" })).toBeVisible();
    await page.getByRole("link", { name: "Studie 2" }).click();
    await expect(page).toHaveURL(/\/admin\/study2$/);

    // Heading + at least one session row from earlier curl submit
    await expect(page.getByRole("heading", { name: /Studie 2/ })).toBeVisible();
    await expect(page.getByText("Sessions gesamt")).toBeVisible();
    // The recent submit had Informatik and semester 3
    await expect(page.locator("table")).toBeVisible();

    // CSV export
    const csvPromise = page.waitForResponse((r) => r.url().includes("/api/admin/study2/export?format=csv"));
    await page.getByRole("link", { name: "CSV Export" }).click();
    const csvRes = await csvPromise;
    expect(csvRes.status()).toBe(200);
    const csvText = await csvRes.text();
    expect(csvText).toContain("sessionId");
    expect(csvText).toContain("WS2-01");

    // JSON export
    const jsonRes = await page.request.get("/api/admin/study2/export?format=json");
    expect(jsonRes.status()).toBe(200);
    const json = await jsonRes.json();
    expect(json.total).toBeGreaterThanOrEqual(1);
    expect(json.sessions[0].answers.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Studie 2 — Mobile 375px", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("/pilot intro: kein horizontaler Scroll", async ({ page }) => {
    await page.goto("/pilot");
    await expect(page.getByRole("heading", { name: /Hilf uns, FOMO besser zu machen/ })).toBeVisible();
    const overflowsX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflowsX).toBe(false);
    for (const title of ["Wer wird gesucht", "Warum wir dich brauchen", "Was passiert mit den Daten", "Dauer", "Was du bekommst"]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
  });

  test("/pilot/quiz: Touch-Target Größen", async ({ page }) => {
    await page.goto("/pilot/quiz");
    // Wait for groups to load
    await page.waitForResponse((r) => r.url().includes("/api/study2/groups"));
    // Type a search → pick first
    await page.getByPlaceholder("Gruppe suchen…").fill("AEGEE");
    await page.locator("button", { hasText: "AEGEE Dresden" }).first().click();
    // Weiter button
    const weiter = page.getByRole("button", { name: "Weiter" });
    const box = await weiter.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);

    await weiter.click();
    // Filter step
    await page.getByText("Hands-on bauen & Werkstatt").click();
    await page.getByRole("button", { name: "Weiter" }).click();

    // Item step — three big buttons
    const stimmeZu = page.getByRole("button", { name: "Stimme zu" });
    const itemBox = await stimmeZu.boundingBox();
    expect(itemBox).not.toBeNull();
    expect(itemBox!.height).toBeGreaterThanOrEqual(40);

    const overflowsX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflowsX).toBe(false);
  });

  test("Homepage Prelaunch: 3 CTAs stapeln, kein H-Scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Hilf uns, FOMO zu kalibrieren/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Prototyp ansehen/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Registriert eure Gruppe/ })).toBeVisible();
    const overflowsX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflowsX).toBe(false);
  });
});
