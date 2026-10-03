// SPDX-License-Identifier: AGPL-3.0-only
// Privacy policy of the registration/admin app. The public site has its own
// (static-site/src/app/datenschutz/page.tsx). Retention periods and handling of
// requests: docs/datenschutz-loeschkonzept.md — keep both in sync.

import type { Metadata } from "next";
import { OPERATOR, OPERATOR_ADDRESS } from "@/lib/legal";
import { PUBLIC_SITE_URL } from "@/lib/public-site";
import { Link } from "@/i18n/navigation";
import { LegalPage, Section } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – FOMO",
};

const strong = "font-semibold text-foreground";

export default function DatenschutzPage() {
  const mail = (
    <a href={`mailto:${OPERATOR.email}`} className="underline">
      {OPERATOR.email}
    </a>
  );

  return (
    <LegalPage title="Datenschutzerklärung">
      <Section title="Worum es geht">
        <p>
          Diese Seite gilt für die <strong className={strong}>Registrierungs- und
          Verwaltungs-App</strong> von FOMO: Hier registrieren Hochschulgruppen ihr Profil, ändern
          es über ihren Bearbeitungslink, und das FOMO-Team pflegt die Daten. Für das Quiz und das
          Gruppenverzeichnis auf{" "}
          <a href={PUBLIC_SITE_URL} className="underline">
            {PUBLIC_SITE_URL.replace("https://", "")}
          </a>{" "}
          gilt die dortige Datenschutzerklärung.
        </p>
      </Section>

      <Section title="Verantwortlicher">
        <p className="whitespace-pre-line">{OPERATOR_ADDRESS}</p>
        <p className="mt-2">E-Mail: {mail}</p>
        <p className="mt-2">
          Siehe auch das <Link href="/impressum" className="underline">Impressum</Link>.
        </p>
      </Section>

      <Section title="Hosting und Server-Logs">
        <p>
          Die App läuft bei <strong className={strong}>Vercel</strong> (Vercel Inc., USA); die
          Daten liegen in einer PostgreSQL-Datenbank, die über diesen Hoster bereitgestellt wird.
          Beim Aufruf verarbeitet der Hoster technisch notwendige Server-Logdaten (u. a.
          IP-Adresse, Datum/Uhrzeit, abgerufene Seite, User-Agent), um Auslieferung und Sicherheit
          zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
          an einem sicheren Betrieb). Bei Übermittlung in die USA stützt sich Vercel auf die
          EU-Standardvertragsklauseln.
        </p>
      </Section>

      <Section title="Registrierung einer Hochschulgruppe">
        <p>Bei der Registrierung und bei späteren Änderungen verarbeiten wir:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>
            <strong className={strong}>Angaben zur Gruppe</strong> (Name, Kategorie,
            Beschreibungen, Kontakt-E-Mail der Gruppe, Website, Instagram, Mitgliederzahl,
            Gründungsjahr, Treffen) und ihre <strong className={strong}>Selbsteinschätzung</strong>{" "}
            (21 Aussagen, Aktivitäten). Diese Angaben werden auf der FOMO-Website{" "}
            <strong className={strong}>öffentlich angezeigt</strong> und für das Matching genutzt.
          </li>
          <li className="mt-1">
            Die <strong className={strong}>verantwortliche Person</strong> (Name, E-Mail, Rolle in
            der Gruppe). Diese Angaben sind <strong className={strong}>nicht öffentlich</strong>;
            wir nutzen sie nur für Rückfragen zum Gruppenprofil.
          </li>
        </ul>
        <p className="mt-2">
          Rechtsgrundlage ist eure Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die ihr bei der
          Registrierung gebt. Ihr könnt sie jederzeit per E-Mail an {mail} widerrufen; dann löschen
          wir das Profil bzw. die Kontaktdaten. Die Rechtmäßigkeit der bis dahin erfolgten
          Verarbeitung bleibt unberührt.
        </p>
      </Section>

      <Section title="Bearbeitungslinks und Änderungsprotokoll">
        <p>
          Jede Gruppe bekommt einen persönlichen Bearbeitungslink (12 Monate gültig, jederzeit
          widerrufbar). Gespeichert wird nur ein Prüfwert des Links, nicht der Link selbst.
          Abgelaufene oder widerrufene Links löschen wir nach 30 Tagen.
        </p>
        <p className="mt-2">
          Änderungen an einem Gruppenprofil werden mit altem und neuem Wert protokolliert, damit das
          FOMO-Team sie nachvollziehen und bei Fehlern rückgängig machen kann (Art. 6 Abs. 1 lit. f
          DSGVO, berechtigtes Interesse an richtigen Daten).
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Die App setzt ein technisch notwendiges Cookie für die gewählte Sprache (
          <code>NEXT_LOCALE</code>, gilt bis zum Schließen des Browsers). Für die Anmeldung des
          FOMO-Teams kommen Sitzungs- und Sicherheits-Cookies hinzu. Es gibt keine Werbe- oder
          Tracking-Cookies.
        </p>
      </Section>

      <Section title="Anmeldung des FOMO-Teams">
        <p>
          Für Admin-Konten speichern wir E-Mail, Name, das Passwort nur als Hash (nie im Klartext) und den
          Zeitpunkt der letzten Anmeldung. Zum Schutz vor Passwort-Raten werden fehlgeschlagene
          Anmeldungen kurzzeitig gezählt (gespeichert wird nur ein Prüfwert der E-Mail, gelöscht
          nach einem Tag). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      </Section>

      <Section title="Reichweitenmessung (optional)">
        <p>
          Sofern aktiviert, misst die App Seitenaufrufe mit <strong className={strong}>Umami
          Cloud</strong> (Umami Software, Inc., USA) – ohne Cookies, ohne Nutzerprofile und ohne
          Inhalte, die ihr in Formulare eingebt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an der Verbesserung des Angebots). Ist Umami nicht eingerichtet,
          findet keine Messung statt.
        </p>
      </Section>

      <Section title="Speicherdauer">
        <p>
          Gruppenprofile speichern wir, solange die Gruppe bei FOMO gelistet ist; Kontaktdaten der
          verantwortlichen Person, solange sie für die Gruppe ansprechbar ist, oder bis zum
          Widerruf. Danach werden sie gelöscht, spätestens mit dem Ablauf der Sicherungskopien.
        </p>
      </Section>

      <Section title="Eure Rechte">
        <p>
          Ihr habt nach DSGVO das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
          (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch
          (Art. 21) sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde, in Sachsen bei
          der Sächsischen Datenschutz- und Transparenzbeauftragten. Anfragen bitte an {mail}.
        </p>
      </Section>

      <p className="text-xs">Stand: Oktober 2026</p>
    </LegalPage>
  );
}
