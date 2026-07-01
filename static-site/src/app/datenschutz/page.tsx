// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { seoAlternates } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Wie FOMO mit Daten umgeht: clientseitiges Matching, keine Nutzerprofile, keine Cookies.",
  alternates: seoAlternates("/datenschutz", "/datenschutz", "de"),
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
            <strong className="text-navy"> vollständig in deinem Browser</strong>. Deine Antworten
            werden <strong className="text-navy">nicht an einen Server gesendet</strong>, nicht
            gespeichert und keiner Person zugeordnet. Es gibt keine Anmeldung und standardmäßig
            keine Cookies.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">Verantwortlicher</h2>
          <p className="mt-2 whitespace-pre-line">
            {`Victor Kling
Katherienstraße 17
01099 Dresden
E-Mail: [E-Mail-Adresse eintragen]`}
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
          <h2 className="font-heading text-lg text-navy">Quiz & Matching (keine Datenübertragung)</h2>
          <p className="mt-2">
            Die Fragen und die Gruppenprofile werden einmalig mit der Seite geladen. Die Berechnung
            deiner Ergebnisse passiert ausschließlich lokal in deinem Gerät. Ein Ergebnis-Link
            enthält lediglich deine Antworten in kodierter Form in der URL – er wird nur erzeugt,
            wenn du selbst teilst oder speicherst, und an niemanden automatisch gesendet.
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
            cookielose, anonyme Statistik ohne personenbezogene Profile und ohne Einwilligungsbanner.
            Es werden nur aggregierte Ereignisse (z. B. „Quiz gestartet") ohne personenbeziehbare
            Kennung erfasst. Ist Umami nicht konfiguriert, findet keinerlei Tracking statt.
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

        <p className="text-xs text-muted">Stand: [Datum eintragen]</p>
      </div>
    </div>
  );
}
