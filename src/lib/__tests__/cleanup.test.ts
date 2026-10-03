// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { DEAD_LINK_GRACE_DAYS, LOGIN_ATTEMPT_KEEP_DAYS, cleanupFilters } from "@/lib/cleanup";

const now = new Date("2026-10-03T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

describe("cleanupFilters", () => {
  const where = cleanupFilters(now);

  it("keeps dead links for the grace period, then deletes them", () => {
    expect(DEAD_LINK_GRACE_DAYS).toBe(30);
    expect(where.editTokens).toEqual({
      OR: [{ revokedAt: { lt: daysAgo(30) } }, { expiresAt: { lt: daysAgo(30) } }],
    });
    expect(where.invites).toEqual({
      OR: [{ usedAt: { lt: daysAgo(30) } }, { expiresAt: { lt: daysAgo(30) } }],
    });
  });

  it("deletes failed logins after a day", () => {
    expect(LOGIN_ATTEMPT_KEEP_DAYS).toBe(1);
    expect(where.loginAttempts).toEqual({ createdAt: { lt: daysAgo(1) } });
  });
});
