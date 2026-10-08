// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { TransparencyContent } from "@/components/TransparencyContent";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "So funktioniert das Matching",
  description:
    "Transparenz: Wie FOMO deine Hochschulgruppen-Matches berechnet – einfache, offene Formel, keine KI, alles im Browser.",
  alternates: seoAlternates("/transparenz", "/en/transparenz", "de"),
};

export default function TransparenzPage() {
  return <TransparencyContent lang="de" />;
}
