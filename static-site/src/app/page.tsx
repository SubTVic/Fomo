// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { HomePageContent } from "@/components/HomePageContent";
import { seoAlternates } from "@/lib/site";
import { FAQ_DE, faqPageLd } from "@/lib/faq";
import { getGroups } from "@/lib/data";

export const metadata: Metadata = {
  alternates: seoAlternates("/", "/en", "de"),
};

export default function HomePage() {
  const groupCount = getGroups().length;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd(FAQ_DE)) }}
      />
      <HomePageContent lang="de" groupCount={groupCount} />
    </>
  );
}
