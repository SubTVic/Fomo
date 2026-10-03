// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect } from "@playwright/test";

test.describe("API Validation", () => {
  test("POST /api/groups/register with empty body returns 422", async ({
    request,
  }) => {
    const res = await request.post("/api/groups/register", {
      data: {},
    });
    expect(res.status()).toBe(422);
  });

  test("GET /api/admin/groups/pending without auth returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/groups/pending");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/users without auth returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/users");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/backup without auth returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/backup");
    expect(res.status()).toBe(401);
  });

  // Pilot, study 2 and the legacy quiz were removed (Umsetzungsplan WP-5.2).
  for (const path of [
    "/api/pilot/export",
    "/api/admin/pilot/statistics",
    "/api/admin/study2/export",
    "/api/admin/quiz/theses",
  ]) {
    test(`GET ${path} is gone (404)`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }
});
