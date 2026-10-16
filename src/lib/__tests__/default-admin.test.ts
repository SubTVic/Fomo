// SPDX-License-Identifier: AGPL-3.0-only

import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  DEV_ADMIN_PASSWORD,
  findAdminsWithDefaultPassword,
  usesDefaultPassword,
} from "@/lib/default-admin";

describe("default admin password check", () => {
  it("flags a hash of the public seed password", async () => {
    const seeded = await hash(DEV_ADMIN_PASSWORD, 4);
    expect(await usesDefaultPassword(seeded)).toBe(true);
  });

  it("does not flag a changed password or a missing hash", async () => {
    expect(await usesDefaultPassword(await hash("something-else-123", 4))).toBe(false);
    expect(await usesDefaultPassword(null)).toBe(false);
  });

  it("returns only the affected admins", async () => {
    const result = await findAdminsWithDefaultPassword([
      { id: "a", email: "admin@fomo.dev", passwordHash: await hash(DEV_ADMIN_PASSWORD, 4) },
      { id: "b", email: "real@example.org", passwordHash: await hash("a-real-password", 4) },
    ]);
    expect(result).toEqual([{ id: "a", email: "admin@fomo.dev" }]);
  });
});
