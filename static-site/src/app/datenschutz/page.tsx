// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { sitePath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Wie FOMO mit Daten umgeht: clientseitiges Matching, keine Nutzerprofile, keine Cookies.",
  // German-only page — plain canonical, no hreflang pair (there is no /en twin).
  alternates: { canonical: sitePath("/datenschutz") },
  robots: { index: true, follow: true },
};

// PLACEHOLDER: An die echten Anbieter-Angaben anpassen ([ … ]). Der Text ist
// auf die statische FOMO-Seite zugeschnitten (kein Login, kein Tracking per
// Default, clientseitiges Matching). Vor dem Launch juristisch prüfen lassen.
export default function DatenschutzPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl text-navy sm:text-4xl">Datenschutzerklärung</h1>

      <div className="mt-8 space-y-8 text-body">
        <section>
          <h2 className="font-heading text-lg text-navy">Kurzfassung</h2>
          <p className="mt-2">
            FOMO ist datensparsam gebaut. Das Quiz und das Matching laufen
            <strong className="text-navy"> vollständig in deinem Browser</strong>. Es gibt keine
            Anmeldung und standardmäßig keine Cookies, und deine Antworten werden
            <strong className="text-navy"> keiner Person zugeordnet</strong>. Sofern die
            Reichweitenmessung aktiviert ist, werden deine Quiz-Antworten zusätzlich in
            <strong className="text-navy"> anonymer, aggregierter Form</strong> zur Verbesserung des
            Angebots erfasst (ohne Identifikationsmerkmal) – Details unten unter „Reichweitenmessung".
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Verantwortlicher</h2>
          <p className="mt-2 whitespace-pre-line">
            {`Victor Kling
Katharinenstraße 17
01099 Dresden
E-Mail: fomo@yeti-dresden.org`}
          </p>
          <p className="mt-2">Siehe auch das Impressum.</p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Hosting</h2>
          <p className="mt-2">
            Die Seite wird als statische Website bei <strong className="text-navy">Vercel</strong>{" "}
            (Vercel Inc., USA) gehostet. Beim Aufruf verarbeitet der Hoster technisch notwendige
            Server-Logdaten (u. a. IP-Adresse, Datum/Uhrzeit, abgerufene Seite, User-Agent), um die
            Auslieferung und Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
            DSGVO (berechtigtes Interesse an einem sicheren Betrieb). Bei Übermittlung in die USA
            stützt sich Vercel auf die EU-Standardvertragsklauseln.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Quiz & Matching</h2>
          <p className="mt-2">
            Die Fragen und die Gruppenprofile werden einmalig mit der Seite geladen. Die Berechnung
            deiner Ergebnisse (das Matching) passiert <strong className="text-navy">ausschließlich
            lokal in deinem Gerät</strong> – die Empfehlungen selbst verlassen deinen Browser nicht.
            Ein Ergebnis-Link enthält deine Antworten in kodierter Form in der URL und wird nur
            erzeugt, wenn du selbst teilst oder speicherst. Unabhängig davon können die Antworten –
            sofern die Reichweitenmessung aktiviert ist – anonym und ohne Personenbezug an die
            Statistik übermittelt werden (siehe nächster Abschnitt).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Schriftarten</h2>
          <p className="mt-2">
            Schriftarten werden <strong className="text-navy">selbst gehostet</strong> und von
            unserem eigenen Server geladen. Es besteht keine Verbindung zu Google Fonts, es werden
            keine Daten an Dritte übertragen.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Reichweitenmessung (optional)</h2>
          <p className="mt-2">
            Sofern aktiviert, nutzt FOMO <strong className="text-navy">Umami</strong> – eine
            cookielose Statistik ohne personenbezogene Profile und ohne Einwilligungsbanner. Erfasst
            werden anonyme Ereignisse ohne personenbeziehbare Kennung: dass ein Quiz gestartet,
            Frage für Frage durchlaufen und abgeschlossen wurde, welche Gruppen dabei als
            Ergebnis vorgeschlagen wurden, welche Gruppen-Links angeklickt
            werden (aus dem Browsen, den Ergebnissen oder von Profilseiten), Bedienelemente wie die
            Vergleichs-Ansicht, Sprachumschaltung, der Klick auf „Gruppe registrieren" oder das
            optionale 👍/👎-Feedback, die freiwillige
            Angabe, ob du bereits Mitglied einer Hochschulgruppe bist (und welcher), und – zur
            Verbesserung des Frage- und Matching-Konzepts – die{" "}
            <strong className="text-navy">gegebenen Quiz-Antworten (die 21 Fragen und die gewählten
            Filter)</strong>. Interaktions-Ereignisse rund um dein Ergebnis (Gruppen-Klicks, Feedback,
            Mitglieds-Angabe) enthalten diese Antworten zusätzlich in kodierter Form, damit wir
            auswerten können, wie gut unsere Empfehlungen zum tatsächlichen Interesse passen.
            Diese Ereignisse enthalten keine Namen, keine Kontaktdaten und keine ID;
            sie lassen sich keiner Person zuordnen und werden nur
            aggregiert ausgewertet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an der Verbesserung des Angebots). Ist Umami nicht konfiguriert, findet
            keinerlei Tracking statt.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Deine Rechte</h2>
          <p className="mt-2">
            Du hast nach DSGVO das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
            (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch
            (Art. 21) sowie ein Beschwerderecht bei einer Aufsichtsbehörde, z. B. dem Sächsischen
            Datenschutzbeauftragten. Da wir keine personenbezogenen Nutzerdaten speichern, betreffen
            diese Rechte im Wesentlichen die o. g. Server-Logs des Hosters.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Kontakt zu Hochschulgruppen</h2>
          <p className="mt-2">
            Auf den Gruppenseiten verlinkte E-Mail-Adressen, Websites und Social-Media-Profile
            liegen in der Verantwortung der jeweiligen Gruppen. Nimmst du Kontakt auf, gelten deren
            Datenschutzbestimmungen.
          </p>
        </section>

        <p className="text-xs text-muted">Stand: Juli 2026</p>
      </div>
    </div>
  );
}
