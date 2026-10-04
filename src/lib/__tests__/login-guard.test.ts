// SPDX-License-Identifier: AGPL-3.0-only

import { compare } from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  DUMMY_PASSWORD_HASH,
  LOCK_MS,
  MAX_FAILURES,
  WINDOW_MS,
  hashLoginEmail,
  lockedUntil,
  normalizeEmail,
} from "@/lib/login-guard";

const MIN = 60 * 1000;
const t0 = new Date("2026-10-03T12:00:00Z").getTime();
const at = (minutes: number) => new Date(t0 + minutes * MIN);

describe("normalizeEmail / hashLoginEmail", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(normalizeEmail("  Admin@FOMO.dev ")).toBe("admin@fomo.dev");
    expect(hashLoginEmail("Admin@FOMO.dev")).toBe(hashLoginEmail("admin@fomo.dev"));
  });

  it("stores a sha256 hex digest, not the address", () => {
    const h = hashLoginEmail("admin@fomo.dev");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("admin");
  });
});

describe("lockedUntil", () => {
  it("uses the documented limits (5 failures in 15 min → 15 min lock)", () => {
    expect(MAX_FAILURES).toBe(5);
    expect(WINDOW_MS).toBe(15 * MIN);
    expect(LOCK_MS).toBe(15 * MIN);
  });

  it("does not lock below the limit", () => {
    const four = [0, 1, 2, 3].map(at);
    expect(lockedUntil(four, at(4))).toBeNull();
  });

  it("locks for 15 minutes from the fifth failure within the window", () => {
    const five = [0, 1, 2, 3, 10].map(at);
    expect(lockedUntil(five, at(11))).toEqual(at(25));
    expect(lockedUntil(five, at(24.9))).toEqual(at(25));
    expect(lockedUntil(five, at(25))).toBeNull();
  });

  it("does not lock when the failures are spread over more than the window", () => {
    const spread = [0, 4, 8, 12, 16].map(at); // first to fifth: 16 min
    expect(lockedUntil(spread, at(17))).toBeNull();
  });

  it("ignores input order", () => {
    const shuffled = [10, 0, 3, 1, 2].map(at);
    expect(lockedUntil(shuffled, at(11))).toEqual(at(25));
  });

  it("locks again after a lock ended only on five new failures within the window", () => {
    const first = [0, 1, 2, 3, 4]; // locked until minute 19
    expect(lockedUntil(first.map(at), at(19))).toBeNull();
    const oneMore = [...first, 20];
    expect(lockedUntil(oneMore.map(at), at(21))).toBeNull();
    const burst = [...first, 20, 21, 22, 23, 24];
    expect(lockedUntil(burst.map(at), at(25))).toEqual(at(39));
  });
});

describe("DUMMY_PASSWORD_HASH", () => {
  it("is a valid bcrypt hash with the same cost as admin passwords", async () => {
    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2[aby]\$12\$/);
    await expect(compare("fomo-dev-2026!", DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });
});
