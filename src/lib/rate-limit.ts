// SPDX-License-Identifier: AGPL-3.0-only
// Simple in-memory rate limiter for API routes

const hits = new Map<string, number[]>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Returns true if the request should be BLOCKED (rate limit exceeded).
 * @param key   Unique identifier (e.g. IP or route+IP)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries to prevent memory leak
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [k, timestamps] of hits) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(k);
      } else {
        hits.set(k, valid);
      }
    }
  }

  const timestamps = hits.get(key) ?? [];

  // Remove expired entries
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    hits.set(key, valid);
    return true;
  }

  valid.push(now);
  hits.set(key, valid);
  return false;
}

/**
 * Extract a client identifier from request headers.
 * Uses x-forwarded-for (proxy) or falls back to a generic key.
 */
export function getClientKey(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
