// SPDX-License-Identifier: AGPL-3.0-only

import crypto from "node:crypto";

/**
 * Constant-time check of an `Authorization: Bearer …` header against
 * EXPORT_TOKEN. Disabled (always false) unless a token of ≥ 32 chars is set.
 */
export function hasValidExportToken(authorization: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const presented = authorization.slice("Bearer ".length).trim();
  const a = crypto.createHash("sha256").update(presented).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
