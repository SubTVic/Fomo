// SPDX-License-Identifier: AGPL-3.0-only
// Pflichtangaben nach § 5 DDG und § 18 Abs. 2 MStV — same content as the
// imprint of the public site (static-site/src/app/impressum/page.tsx).

import type { Metadata } from "next";
import { OPERATOR, OPERATOR_ADDRESS } from "@/lib/legal";
import { PUBLIC_SITE_URL } from "@/lib/public-site";
import { LegalPage, Section } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Impressum – FOMO",
};

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <Section title="Angaben gemäß § 5 DDG">
        <p className="whitespace-pre-line">{OPERATOR_ADDRESS}</p>
      </Section>
      <Section title="Kontakt">
        <p>
          E-Mail:{" "}
          <a href={`mailto:${OPERATOR.email}`} className="underline">
            {OPERATOR.email}
          </a>
        </p>
      </Section>
      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p className="whitespace-pre-line">{OPERATOR_ADDRESS}</p>
      </Section>
      <Section title="Haftung für Inhalte">
        <p>
          Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          Die Angaben der Hochschulgruppen stammen von den Gruppen selbst.
        </p>
      </Section>
      <Section title="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
          verantwortlich.
        </p>
      </Section>
      <Section title="Urheberrecht & Lizenz">
        <p>
          Der Quellcode von FOMO steht unter der AGPL-3.0-Lizenz. Logos und Inhalte der
          Hochschulgruppen liegen bei den jeweiligen Gruppen.
        </p>
      </Section>
      <p className="text-xs">
        Dies ist die Registrierungs- und Verwaltungs-App von FOMO. Quiz und Gruppenverzeichnis:{" "}
        <a href={PUBLIC_SITE_URL} className="underline">
          {PUBLIC_SITE_URL.replace("https://", "")}
        </a>
      </p>
    </LegalPage>
  );
}
