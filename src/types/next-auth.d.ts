// SPDX-License-Identifier: AGPL-3.0-only

import type { AdminRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: AdminRole;
  }
  interface Session {
    user: User & {
      id: string;
      role?: AdminRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AdminRole;
  }
}
