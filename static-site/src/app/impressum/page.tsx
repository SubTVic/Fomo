// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { sitePath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und Kontakt für FOMO.",
  // German-only page — plain canonical, no hreflang pair (there is no /en twin).
  alternates: { canonical: sitePath("/impressum") },
  robots: { index: true, follow: true },
};

// Pflichtangaben nach § 5 DDG (ehem. TMG) und § 18 Abs. 2 MStV.
// Betrieben als Privatperson.
export default function ImpressumPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl text-navy sm:text-4xl">Impressum</h1>

      <div className="mt-8 space-y-8 text-body">
        <section>
          <h2 className="font-heading text-lg text-navy">Angaben gemäß § 5 DDG</h2>
          <p className="mt-2 whitespace-pre-line">
            {`Victor Kling
Katharinenstraße 17
01099 Dresden`}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Kontakt</h2>
          <p className="mt-2 whitespace-pre-line">
            {`E-Mail: fomo@yeti-dresden.org`}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="mt-2 whitespace-pre-line">
            {`Victor Kling
Katharinenstraße 17
01099 Dresden`}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Haftung für Inhalte</h2>
          <p className="mt-2">
            Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            Die Profile der Hochschulgruppen beruhen teils auf öffentlich zugänglichen Quellen und
            werden, wo möglich, von den Gruppen selbst bestätigt.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Haftung für Links</h2>
          <p className="mt-2">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
            verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Urheberrecht & Lizenz</h2>
          <p className="mt-2">
            Der Quellcode von FOMO steht unter der AGPL-3.0-Lizenz. Logos und Inhalte der
            Hochschulgruppen liegen bei den jeweiligen Gruppen.
          </p>
        </section>
      </div>
    </div>
  );
}
