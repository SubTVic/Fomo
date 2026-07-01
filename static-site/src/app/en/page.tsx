// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { HomePageContent } from "@/components/HomePageContent";
import { seoAlternates, absUrl } from "@/lib/site";

const EN_DESCRIPTION =
  "Take a short quiz and find which of 80+ student groups at TU Dresden fit you. Fully anonymous, the matching runs in your browser.";

export const metadata: Metadata = {
  // "absolute" bypasses the layout's "%s — FOMO" template — this title already
  // contains "FOMO", so the template would otherwise double it up.
  title: { absolute: "FOMO — Find your student group at TU Dresden" },
  description: EN_DESCRIPTION,
  alternates: seoAlternates("/", "/en", "en"),
  openGraph: {
    locale: "en_US",
    url: absUrl("/en"),
    title: "FOMO — Find your student group at TU Dresden",
    description: EN_DESCRIPTION,
  },
  twitter: {
    title: "FOMO — Find your student group at TU Dresden",
    description: EN_DESCRIPTION,
  },
};

export default function EnglishHomePage() {
  return <HomePageContent lang="en" />;
}
