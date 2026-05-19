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
    "Find the student group that fits you. Answer ~20 questions and get personalised recommendations for student groups at TU Dresden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {umamiWebsiteId && (
          <script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={umamiWebsiteId}
          />
        )}
      </head>
      <body className={`${archivoBlack.variable} ${lexend.variable} antialiased`}>{children}</body>
    </html>
  );
}
