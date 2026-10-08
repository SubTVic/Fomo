// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { TransparencyContent } from "@/components/TransparencyContent";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "How the matching works",
  description:
    "Transparency: how FOMO calculates your student-group matches – a simple, open formula, no AI, all in your browser.",
  alternates: seoAlternates("/transparenz", "/en/transparenz", "en"),
};

export default function EnglishTransparencyPage() {
  return <TransparencyContent lang="en" />;
}
