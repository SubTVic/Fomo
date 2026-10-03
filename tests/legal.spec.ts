// SPDX-License-Identifier: AGPL-3.0-only

// End-to-end for WP-5.6: imprint and privacy page of the registration app,
// reachable from the footer; same operator as the public site.

import { test, expect } from "@playwright/test";

test.use({ locale: "de-DE" });

test("footer links to imprint and privacy policy", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Impressum" }).click();
  await expect(page.getByRole("heading", { name: "Impressum", level: 1 })).toBeVisible();
  await expect(page.getByText("Victor Kling").first()).toBeVisible();

  await page.getByRole("contentinfo").getByRole("link", { name: "Datenschutz" }).click();
  await expect(page.getByRole("heading", { name: "Datenschutzerklärung", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Registrierung einer Hochschulgruppe" })).toBeVisible();
});

test("English locale shows the German legal pages with English footer labels", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/en\/datenschutz$/);
  await expect(page.getByRole("heading", { name: "Datenschutzerklärung", level: 1 })).toBeVisible();
});
