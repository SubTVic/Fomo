// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UmamiScript } from "@/components/UmamiScript";

export const metadata: Metadata = {
  title: {
    default: "FOMO — Finde deine Hochschulgruppe",
    template: "%s — FOMO",
  },
  description:
    "Beantworte ein kurzes Quiz und finde aus über 80 Hochschulgruppen der TU Dresden die, die zu dir passen. Komplett anonym, Matching läuft in deinem Browser.",
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
        <Navbar />
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <Footer />
        <UmamiScript />
      </body>
    </html>
  );
}
