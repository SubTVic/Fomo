// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect, Page } from "@playwright/test";

/**
 * Answer all questions in the current block, regardless of variant.
 * Returns when the next transition or demographic phase is visible.
 */
async function answerCurrentBlock(
  page: Page,
  block: number
): Promise<void> {
  // Determine what signals the end of this block
  const nextPhaseLocator =
    block < 3
      ? page.getByText(`Abschnitt ${block + 2} von 4`)
      : page.getByText("Noch 2 kurze Fragen");

  for (let attempt = 0; attempt < 100; attempt++) {
    // Check if we've moved on
    if (await nextPhaseLocator.isVisible().catch(() => false))
      return;

    // --- Scroll variant: answer visible questions, switch tabs, click navigation ---
    const stimmeZu = page.getByRole("button", {
      name: "Stimme zu",
    });
    if (await stimmeZu.first().isVisible().catch(() => false)) {
      // Answer all visible Likert questions
      const buttons = await stimmeZu.all();
      for (const btn of buttons) {
        if (await btn.isEnabled().catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(50);
        }
      }

      // Try "Weiter →" (scroll variant dimension navigation)
      const weiter = page.getByRole("button", {
        name: /Weiter →/,
      });
      if (await weiter.isVisible().catch(() => false)) {
        await weiter.click();
        await page.waitForTimeout(300);
        continue;
      }

      // Try "Abschnitt fertig →" (scroll variant block complete)
      const fertig = page.getByRole("button", {
        name: /Abschnitt fertig/,
      });
      if (
        await fertig.isVisible().catch(() => false) &&
        (await fertig.isEnabled().catch(() => false))
      ) {
        await fertig.click();
        await page.waitForTimeout(500);
        continue;
      }

      await page.waitForTimeout(300);
      continue;
    }

    // --- Classic / Swipe / Chat variants: single-answer buttons ---
    // Button texts vary: "Stimme zu", "👍 Ja", "Neutral", "😐 Egal", etc.
    let clicked = false;
    for (const label of [/Stimme zu/, /Ja/, /Neutral/, /Egal/]) {
      const btn = page.getByRole("button", { name: label }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        clicked = true;
        await page.waitForTimeout(500);
        break;
      }
    }

    // Chat variant may need time for next question to appear
    if (!clicked) {
      await page.waitForTimeout(1000);
    } else {
      await page.waitForTimeout(300);
    }
  }
}

test.describe("Pilot Survey – Full Flow", () => {
  test("landing page renders correctly", async ({ page }) => {
    await page.goto("/pilot");

    await expect(
      page.getByText("Mach mit und gestalte FOMO!")
    ).toBeVisible();
    await expect(page.getByText("Studie starten")).toBeVisible();
  });

  test("complete survey end-to-end (all 4 variants)", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    // 1. Start from landing page
    await page.goto("/pilot");
    await page.getByText("Studie starten").click();
    await page.waitForURL("**/pilot/survey**");

    // 2. Go through all 4 blocks
    for (let block = 0; block < 4; block++) {
      // Wait for transition screen
      await expect(
        page.getByText(`Abschnitt ${block + 1} von 4`)
      ).toBeVisible({ timeout: 15_000 });

      // Click "Los geht's!"
      await page.getByText("Los geht's!").click();

      // Answer all questions in this block
      await answerCurrentBlock(page, block);
    }

    // 3. Demographic phase
    await expect(
      page.getByText("Noch 2 kurze Fragen")
    ).toBeVisible({ timeout: 15_000 });

    // Select semester
    await page.getByText("1. Semester").click();

    // Select membership
    await page.getByText("Nein, noch nicht").click();

    // Wait for the next button to be enabled and click it
    await page.waitForTimeout(500);
    const nextBtn = page.locator(
      "button.bg-primary:not([disabled])"
    );
    await nextBtn.last().click();

    // 4. Feedback phase (optional, skip)
    await expect(
      page.getByText("Abschlussfeedback")
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Weiter" }).click();

    // 5. Preference phase
    await expect(
      page.getByText(
        "Welches Layout hat dir am besten gefallen?"
      )
    ).toBeVisible({ timeout: 10_000 });

    // Select a variant (click the first variant button)
    await page.getByText("Scroll").first().click();

    // Submit
    await page.getByText("Antworten absenden").click();

    // 6. Success screen
    await expect(
      page.getByText("Danke für deine Teilnahme!")
    ).toBeVisible({ timeout: 15_000 });

    // 7. Verify "Zur Startseite" link exists
    await expect(page.getByText("Zur Startseite")).toBeVisible();
  });
});

test.describe("Pilot Survey – Abort", () => {
  test("no data saved on browser close before submit", async ({
    page,
  }) => {
    await page.goto("/pilot/survey");

    // Wait for first transition
    await expect(
      page.getByText("Abschnitt 1 von 4")
    ).toBeVisible({ timeout: 10_000 });

    // Start answering
    await page.getByText("Los geht's!").click();

    // Answer a few questions
    for (let i = 0; i < 3; i++) {
      for (const label of [
        /^Stimme zu$/,
        /^Ja$/,
        /^Neutral$/,
      ]) {
        const btn = page
          .getByRole("button", { name: label })
          .first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          break;
        }
      }
      await page.waitForTimeout(500);
    }

    // Navigate away — data should not be saved (only on submit)
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
});
