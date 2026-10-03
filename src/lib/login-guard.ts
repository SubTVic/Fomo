// SPDX-License-Identifier: AGPL-3.0-only
// Admin login protection: failed attempts are counted per e-mail address in
// the database (so the limit holds across server instances and restarts).
// MAX_FAILURES failures within WINDOW_MS lock the address for LOCK_MS. Only a
// hash of the normalized address is stored, never what was typed in.

import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const LOCK_MS = 15 * 60 * 1000;
/** Failed attempts older than this are deleted; they can no longer matter. */
const KEEP_MS = 24 * 60 * 60 * 1000;

/**
 * bcrypt hash (cost 12, like real admin passwords) of a random throwaway
 * string. Compared against when the address is unknown, so a login takes
 * about as long whether or not the account exists.
 */
export const DUMMY_PASSWORD_HASH = "$2a$12$HbS4atc8ASZrt0EsJ.jzee7diOb17plSYFhYL23O7BCHY5ofze80m";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashLoginEmail(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

/**
 * When does the lock end? A lock starts with the failure that completes
 * MAX_FAILURES failures within WINDOW_MS and lasts LOCK_MS from then.
 * Returns null if the address is not locked at `now`.
 */
export function lockedUntil(failures: Date[], now: Date): Date | null {
  const times = failures.map((d) => d.getTime()).sort((a, b) => a - b);
  let until = 0;
  for (let i = MAX_FAILURES - 1; i < times.length; i++) {
    if (times[i] - times[i - (MAX_FAILURES - 1)] <= WINDOW_MS) {
      until = Math.max(until, times[i] + LOCK_MS);
    }
  }
  return until > now.getTime() ? new Date(until) : null;
}

/** Failures that can still contribute to a current lock. */
async function recentFailures(db: Db, emailHash: string, now: Date): Promise<Date[]> {
  const rows = await db.loginAttempt.findMany({
    where: { emailHash, createdAt: { gt: new Date(now.getTime() - WINDOW_MS - LOCK_MS) } },
    select: { createdAt: true },
  });
  return rows.map((r) => r.createdAt);
}

export async function isLoginLocked(db: Db, email: string, now = new Date()): Promise<boolean> {
  return lockedUntil(await recentFailures(db, hashLoginEmail(email), now), now) !== null;
}

export async function recordLoginFailure(db: Db, email: string, now = new Date()): Promise<void> {
  await db.loginAttempt.create({ data: { emailHash: hashLoginEmail(email), createdAt: now } });
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - KEEP_MS) } } });
}

/** A successful login starts the count from zero. */
export async function clearLoginFailures(db: Db, email: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { emailHash: hashLoginEmail(email) } });
}
