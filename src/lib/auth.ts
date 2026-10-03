// SPDX-License-Identifier: AGPL-3.0-only

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  DUMMY_PASSWORD_HASH,
  clearLoginFailures,
  isLoginLocked,
  normalizeEmail,
  recordLoginFailure,
} from "@/lib/login-guard";

/** Too many failed attempts for this address; shown as its own message. */
export class LoginLockedError extends CredentialsSignin {
  code = "locked";
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = normalizeEmail(parsed.data.email);

        if (await isLoginLocked(db, email)) throw new LoginLockedError();

        const admin = await db.admin.findUnique({ where: { email } });
        const usable = admin?.isActive === true && !!admin.passwordHash;
        // Always run bcrypt, also for unknown or inactive accounts.
        const valid = await compare(
          parsed.data.password,
          usable ? admin.passwordHash! : DUMMY_PASSWORD_HASH,
        );
        if (!usable || !valid) {
          await recordLoginFailure(db, email);
          return null;
        }

        await clearLoginFailures(db, email);
        await db.admin.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: unknown }).role = token.role;
        if (token.sub) session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});
