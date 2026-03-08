// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect } from "@playwright/test";

const viewports = [
  { width: 375, height: 812, name: "iPhone" },
  { width: 768, height: 1024, name: "iPad" },
  { width: 1440, height: 900, name: "Desktop" },
] as const;

const pages = [
  { path: "/", name: "Home" },
  { path: "/pilot", name: "Pilot Landing" },
  { path: "/quiz", name: "Quiz" },
  { path: "/groups", name: "Groups" },
  { path: "/groups/register", name: "Group Register" },
  { path: "/admin/login", name: "Admin Login" },
] as const;

for (const viewport of viewports) {
  test.describe(`Responsive – ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
    });

    for (const pg of pages) {
      test(`${pg.name} has no horizontal overflow`, async ({
        page,
      }) => {
        await page.goto(pg.path);
        await page.waitForLoadState("networkidle");

        // Check that body does not overflow horizontally
        const bodyWidth = await page.evaluate(
          () => document.body.scrollWidth
        );
        const windowWidth = await page.evaluate(
          () => window.innerWidth
        );

        expect(bodyWidth).toBeLessThanOrEqual(
          windowWidth + 1 // allow 1px rounding
        );
      });
    }
  });
}
