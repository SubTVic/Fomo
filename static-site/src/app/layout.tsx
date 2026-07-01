// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no Google Fonts request → faster LCP + DSGVO-friendly).
import "@fontsource/archivo-black";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/lexend/700.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UmamiScript } from "@/components/UmamiScript";
import { SITE_URL, absUrl } from "@/lib/site";

const DESCRIPTION =
  "Beantworte ein kurzes Quiz und finde aus über 80 Hochschulgruppen der TU Dresden die, die zu dir passen. Komplett anonym, Matching läuft in deinem Browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FOMO — Finde deine Hochschulgruppe an der TU Dresden",
    template: "%s — FOMO",
  },
  description: DESCRIPTION,
  applicationName: "FOMO",
  keywords: [
    "TU Dresden",
    "Hochschulgruppen",
    "Studentische Gruppen",
    "Ersti",
    "Erstsemester",
    "Studium Dresden",
    "Vereine TU Dresden",
    "FOMO",
  ],
  authors: [{ name: "YETI Dresden" }, { name: "StuRa TU Dresden" }],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "FOMO",
    locale: "de_DE",
    url: absUrl("/"),
    title: "FOMO — Finde deine Hochschulgruppe an der TU Dresden",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FOMO — Finde deine Hochschulgruppe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FOMO — Finde deine Hochschulgruppe an der TU Dresden",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  // Favicon + apple-touch icon are provided via the app/icon.svg and
  // app/apple-icon.png file conventions — Next emits the correct <link> tags.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a2a35",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: `${SITE_URL}/`,
                  name: "FOMO",
                  description: DESCRIPTION,
                  inLanguage: ["de-DE", "en-US"],
                  publisher: { "@id": `${SITE_URL}/#organization` },
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "FOMO",
                  alternateName: "FOMO Dresden",
                  url: `${SITE_URL}/`,
                  description: DESCRIPTION,
                  logo: absUrl("/og.png"),
                  founder: "YETI Dresden",
                  areaServed: "TU Dresden",
                  // Offizielle Profile derselben Entität → hilft Google, FOMO
                  // eindeutig einzuordnen und von gleichnamigen Diensten zu trennen.
                  sameAs: ["https://yeti-dresden.org", "https://www.stura.tu-dresden.de"],
                },
              ],
            }),
          }}
        />
        <Navbar />
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <Footer />
        <UmamiScript />
      </body>
    </html>
  );
}
