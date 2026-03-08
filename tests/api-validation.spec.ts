// SPDX-License-Identifier: AGPL-3.0-only

import { test, expect } from "@playwright/test";

test.describe("API Validation", () => {
  test("POST /api/pilot/submit with empty body returns 422", async ({
    request,
  }) => {
    const res = await request.post("/api/pilot/submit", {
      data: {},
    });
    expect(res.status()).toBe(422);
  });

  test("POST /api/pilot/submit with missing answers returns 422", async ({
    request,
  }) => {
    const res = await request.post("/api/pilot/submit", {
      data: {
        demographic: {
          semester: "1",
          isMember: "no",
          groupNames: null,
        },
        feedback: { confusing: "", missing: "" },
      },
    });
    expect(res.status()).toBe(422);
  });

  test("POST /api/groups/register with empty body returns 422", async ({
    request,
  }) => {
    const res = await request.post("/api/groups/register", {
      data: {},
    });
    expect(res.status()).toBe(422);
  });

  test("GET /api/admin/pilot/statistics without auth returns 401", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/admin/pilot/statistics"
    );
    expect(res.status()).toBe(401);
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

  test("POST /api/admin/questions without auth returns 401", async ({
    request,
  }) => {
    const res = await request.post("/api/admin/questions", {
      data: { text: "Test question" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/pilot/export without API key returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/pilot/export");
    expect(res.status()).toBe(401);
  });
});
