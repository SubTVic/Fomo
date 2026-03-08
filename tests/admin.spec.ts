// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect } from "@playwright/test";

test.describe("Admin – Authentication", () => {
  test("redirect to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/admin/login**");
    await expect(page.getByText("Admin-Login")).toBeVisible();
  });

  test("show error on wrong credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', "wrong@test.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.getByText("Anmelden").click();

    // Should stay on login page or show error
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain("/admin/login");
  });

  test("successful login with seed credentials", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', "admin@fomo.dev");
    await page.fill('input[name="password"]', "fomo-dev-2026!");
    await page.getByText("Anmelden").click();

    // Should redirect to admin dashboard (not /admin/login)
    await expect(page).toHaveURL(/\/admin$/, {
      timeout: 10_000,
    });
    // Nav link "Dashboard" should be visible
    await expect(
      page.getByRole("link", { name: "Dashboard" })
    ).toBeVisible();
  });
});

test.describe("Admin – Protected Pages", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', "admin@fomo.dev");
    await page.fill('input[name="password"]', "fomo-dev-2026!");
    await page.getByText("Anmelden").click();
    await expect(page).toHaveURL(/\/admin$/, {
      timeout: 10_000,
    });
  });

  test("dashboard loads", async ({ page }) => {
    await expect(page.getByText("FOMO Admin")).toBeVisible();
  });

  test("groups page shows imported groups", async ({ page }) => {
    await page.goto("/admin/groups");
    await expect(
      page.getByRole("heading", { name: /Gruppen/i })
    ).toBeVisible();
  });

  test("questions page loads", async ({ page }) => {
    await page.goto("/admin/questions");
    await expect(
      page.getByRole("heading", { name: /Fragen/i })
    ).toBeVisible();
  });

  test("pilot dashboard loads", async ({ page }) => {
    await page.goto("/admin/pilot");
    await expect(
      page.getByRole("heading", { name: /Pilot/i })
    ).toBeVisible();
  });

  test("users page loads", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: /Admin/i })
    ).toBeVisible();
  });

  test("pilot export buttons visible", async ({ page }) => {
    await page.goto("/admin/pilot");
    await expect(
      page.getByRole("button", { name: "CSV" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "JSON" }).first()
    ).toBeVisible();
  });
});
