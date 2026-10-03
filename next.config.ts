import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { PUBLIC_SITE_URL } from "./src/lib/public-site";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Pages removed in Umsetzungsplan WP-5.2 that old links may still point to:
// the prototype quiz, study 2 (/pilot), the demo tour and the root app's
// group directory. Quiz and directory live on the public site.
const LEGACY_REDIRECTS: Array<[string, string]> = [
  ["/quiz/:path*", "/quiz/"],
  ["/pilot/:path*", "/quiz/"],
  ["/demo/:path*", "/quiz/"],
  ["/groups", "/groups/"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return ["", "/de", "/en"].flatMap((prefix) =>
      LEGACY_REDIRECTS.map(([source, target]) => ({
        source: `${prefix}${source}`,
        destination: `${PUBLIC_SITE_URL}${target}`,
        permanent: false,
      })),
    );
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
