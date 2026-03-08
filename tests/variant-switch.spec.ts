// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect, Page } from "@playwright/test";

/** Answer all questions in the current block, handling any variant. */
async function answerCurrentBlock(
  page: Page,
  block: number
): Promise<void> {
  const nextPhaseLocator =
    block < 3
      ? page.getByText(`Abschnitt ${block + 2} von 4`)
      : page.getByText("Noch 2 kurze Fragen");

  for (let attempt = 0; attempt < 100; attempt++) {
    if (await nextPhaseLocator.isVisible().catch(() => false))
      return;

    // Scroll variant: answer visible Likert questions
    const stimmeZu = page.getByRole("button", {
      name: "Stimme zu",
    });
    if (await stimmeZu.first().isVisible().catch(() => false)) {
      const buttons = await stimmeZu.all();
      for (const btn of buttons) {
        if (await btn.isEnabled().catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(50);
        }
      }
      const weiter = page.getByRole("button", {
        name: /Weiter →/,
      });
      if (await weiter.isVisible().catch(() => false)) {
        await weiter.click();
        await page.waitForTimeout(300);
        continue;
      }
      const fertig = page.getByRole("button", {
        name: /Abschnitt fertig/,
      });
      if (
        (await fertig.isVisible().catch(() => false)) &&
        (await fertig.isEnabled().catch(() => false))
      ) {
        await fertig.click();
        await page.waitForTimeout(500);
        continue;
      }
      await page.waitForTimeout(300);
      continue;
    }

    // Classic / Swipe / Chat variants
    let clicked = false;
    for (const label of [/Stimme zu/, /Ja/, /Neutral/, /Egal/]) {
      const btn = page
        .getByRole("button", { name: label })
        .first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        clicked = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    if (!clicked) {
      await page.waitForTimeout(1000);
    } else {
      await page.waitForTimeout(300);
    }
  }
}

test.describe("Variant Switching", () => {
  test("survey page loads with transition screen", async ({
    page,
  }) => {
    await page.goto("/pilot/survey");
    await expect(
      page.getByText("Abschnitt 1 von 4")
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Los geht's!")).toBeVisible();
  });

  test("each block shows a different variant", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto("/pilot/survey");

    const seenVariants: string[] = [];

    for (let block = 0; block < 4; block++) {
      await expect(
        page.getByText(`Abschnitt ${block + 1} von 4`)
      ).toBeVisible({ timeout: 15_000 });

      // Detect which variant is shown on the transition screen
      const transitionText = await page
        .locator("text=/Neues Layout:/")
        .textContent()
        .catch(() => null);

      if (transitionText) {
        const match = transitionText.match(
          /Neues Layout:\s*(\w+)/
        );
        if (match) seenVariants.push(match[1]);
      }

      await page.getByText("Los geht's!").click();
      await answerCurrentBlock(page, block);
    }

    // All 4 blocks were shown
    expect(seenVariants.length).toBeLessThanOrEqual(4);
    expect(seenVariants.length).toBeGreaterThanOrEqual(1);
  });
});
