// SPDX-License-Identifier: AGPL-3.0-only
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match public routes only — exclude admin, api, _next, and static files
  matcher: [
    "/",
    "/(de|en)/:path*",
    "/((?!admin|api|_next|_vercel|.*\\..*).*)",
  ],
};
