// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata, Viewport } from "next";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Lexend:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
                  url: `${SITE_URL}/`,
                  description: DESCRIPTION,
                  logo: absUrl("/og.png"),
                  founder: "YETI Dresden",
                  areaServed: "TU Dresden",
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
