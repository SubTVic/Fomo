// SPDX-License-Identifier: AGPL-3.0-only

import { compare } from "bcryptjs";

// Development admin created by prisma/seed.ts. This password is public (the
// repository is public), so any account still using it must be treated as
// compromised. Keep this file free of "@/..." imports: the seed imports it.
export const DEV_ADMIN_EMAIL = "admin@fomo.dev";
export const DEV_ADMIN_PASSWORD = "fomo-dev-2026!";

export interface AdminWithHash {
  id: string;
  email: string;
  passwordHash: string | null;
}

// bcrypt at cost 12 is slow, and this runs on every admin page. A changed
// password produces a new hash, so caching by hash is always correct.
const verdictByHash = new Map<string, boolean>();

export async function usesDefaultPassword(passwordHash: string | null): Promise<boolean> {
  if (!passwordHash) return false;
  const cached = verdictByHash.get(passwordHash);
  if (cached !== undefined) return cached;
  const verdict = await compare(DEV_ADMIN_PASSWORD, passwordHash);
  verdictByHash.set(passwordHash, verdict);
  return verdict;
}

/** Active admins whose password is still the public seed password. */
export async function findAdminsWithDefaultPassword(
  admins: AdminWithHash[],
): Promise<Array<{ id: string; email: string }>> {
  const flags = await Promise.all(admins.map((a) => usesDefaultPassword(a.passwordHash)));
  return admins.filter((_, i) => flags[i]).map(({ id, email }) => ({ id, email }));
}
