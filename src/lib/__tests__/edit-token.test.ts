// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import {
  editLink,
  editLinkError,
  editTokenExpiry,
  editTokenProblem,
  generateEditToken,
  hashEditToken,
} from "@/lib/edit-token";

describe("generateEditToken", () => {
  it("creates a 256-bit url-safe token and stores only its sha256", () => {
    const { token, tokenHash } = generateEditToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toContain(token);
    expect(hashEditToken(token)).toBe(tokenHash);
  });

  it("never repeats", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateEditToken().token));
    expect(tokens.size).toBe(200);
  });
});

describe("editTokenExpiry", () => {
  it("is 12 months after creation", () => {
    expect(editTokenExpiry(new Date("2026-10-03T12:00:00Z")).toISOString()).toBe(
      "2027-10-03T12:00:00.000Z",
    );
  });
});

describe("editTokenProblem", () => {
  const now = new Date("2026-10-03T12:00:00Z");
  const future = new Date("2027-10-03T12:00:00Z");
  const past = new Date("2026-10-01T12:00:00Z");

  it("accepts an active token any number of times", () => {
    expect(editTokenProblem({ expiresAt: future, revokedAt: null }, now)).toBeNull();
  });

  it("rejects revoked and expired tokens", () => {
    expect(editTokenProblem({ expiresAt: future, revokedAt: past }, now)).toBe("revoked");
    expect(editTokenProblem({ expiresAt: past, revokedAt: null }, now)).toBe("expired");
  });
});

describe("editLink / editLinkError", () => {
  it("builds the edit page link", () => {
    expect(editLink("https://fomo.example/", "a-b_c")).toBe(
      "https://fomo.example/gruppe/bearbeiten?token=a-b_c",
    );
  });

  it("explains every problem and names a contact address", () => {
    for (const problem of ["invalid", "expired", "revoked", "used"] as const) {
      const { error, status } = editLinkError(problem);
      expect(error).toContain("fomo@yeti-dresden.org");
      expect(status).toBeGreaterThanOrEqual(400);
    }
    expect(editLinkError("revoked").error).toContain("zurückgezogen");
  });
});
