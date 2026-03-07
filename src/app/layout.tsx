// SPDX-License-Identifier: AGPL-3.0-only

import type { Metadata } from "next";
import { Archivo_Black, Lexend } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FOMO – Find Our Matching Organizations",
  description:
    "Finde die Hochschulgruppe, die zu dir passt. Beantworte ~20 Fragen und erhalte personalisierte Empfehlungen für Hochschulgruppen an der TU Dresden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${archivoBlack.variable} ${lexend.variable} antialiased`}>{children}</body>
    </html>
  );
}
