// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect } from "@playwright/test";

// Pages removed in Umsetzungsplan WP-5.2 redirect to the public site.
const cases: Array<[string, string]> = [
  ["/quiz", "https://www.fomo-dresden.app/quiz/"],
  ["/de/quiz", "https://www.fomo-dresden.app/quiz/"],
  ["/pilot", "https://www.fomo-dresden.app/quiz/"],
  ["/en/pilot/quiz", "https://www.fomo-dresden.app/quiz/"],
  ["/demo", "https://www.fomo-dresden.app/quiz/"],
  ["/groups", "https://www.fomo-dresden.app/groups/"],
  ["/en/groups", "https://www.fomo-dresden.app/groups/"],
];

for (const [path, target] of cases) {
  test(`${path} redirects to ${target}`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toBe(target);
  });
}

test("group registration is not redirected", async ({ request }) => {
  const res = await request.get("/groups/register", { maxRedirects: 0 });
  expect([200, 307]).toContain(res.status());
  expect(res.headers()["location"] ?? "").not.toContain("fomo-dresden.app");
});
