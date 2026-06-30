// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { HomePageContent } from "@/components/HomePageContent";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  alternates: seoAlternates("/", "/en", "de"),
};

export default function HomePage() {
  return <HomePageContent lang="de" />;
}
