// SPDX-License-Identifier: AGPL-3.0-only
// Lightweight middleware — checks session cookie only (no heavy auth imports).
// Full auth validation happens in individual route handlers via auth().

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Auth.js v5 stores the session in this cookie
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    if (req.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/((?!login).*)", "/api/admin/:path*"],
};
