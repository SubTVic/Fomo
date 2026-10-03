<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Gruppe hat ihren Bearbeitungslink verloren / abgelaufen

**Stand: Oktober 2026** (nach Umsetzungsplan WP-4.2).

**Kurz:** Jede Gruppe bekommt einen **dauerhaften Bearbeitungslink**: 12 Monate
gültig, **mehrfach** nutzbar, jederzeit widerrufbar. Einen neuen Link erzeugt ein
Admin mit einem Klick. Die App verschickt selbst keine Mails (Selbstbedienung per Mail
folgt mit WP-4.3, sobald ein Mailserver feststeht — Entscheidung E3).

## Schritte

1. In der Admin-App einloggen (fomo-pi.vercel.app/admin). Ohne Login: ein SUPER_ADMIN
   muss unter „Admins" ein Konto (Rolle „Editor" reicht) anlegen.
2. „Gruppen" → bei der Gruppe **„Bearbeitungslink"** → **„Link erzeugen"**.
   - Haken **„alte Links dieser Gruppe zurückziehen"** setzen, wenn der alte Link in
     falsche Hände geraten sein könnte (z. B. Vorstand gewechselt).
3. Der Link erscheint **nur jetzt** (die Datenbank speichert ihn nicht im Klartext):
   **„Kopieren"** oder **„Mail an …"** — das öffnet euer Mailprogramm mit dem
   Mustertext unten, adressiert an die hinterlegte Kontaktadresse.
   Form: `https://fomo-pi.vercel.app/gruppe/bearbeiten?token=…`
4. Nur an eine **hinterlegte** Adresse schicken. Der Link wirkt wie ein Passwort.
5. Nach dem Absenden durch die Gruppe: unter **„Änderungen"** kurz prüfen; war die
   Gruppe noch unbestätigt, **verifizieren**. Dann Daten live schalten (Runbook 01).

**Alle Links einer Gruppe sperren:** „Bearbeitungslink" → **„Alle zurückziehen"**.
Wer den alten Link öffnet, sieht „Dieser Bearbeitungslink wurde zurückgezogen" mit der
Kontaktadresse fomo@yeti-dresden.org.

## Mustertext für die Mail

(Steht so auch im „Mail an …"-Knopf.)

> Betreff: Euer Link für das FOMO-Profil
>
> Hallo [Gruppe], hier ist euer Link zum Bearbeiten eures FOMO-Profils: [LINK]. Eure
> bisherigen Antworten sind schon eingetragen – ändert einfach, was nicht mehr passt,
> und schickt am Ende ab (ca. 5 Minuten). Nur Beschreibung, Website oder Kontakt ändern
> geht noch schneller: auf der Startseite „Nur Gruppeninfos ändern" wählen. Der Link
> gilt 12 Monate und kann mehrmals benutzt werden. Bitte nicht öffentlich teilen – wer
> ihn hat, kann euer Profil ändern. Viele Grüße, das FOMO-Team

## Gut zu wissen

- **Alte Einmal-Links** (`/groups/register?token=…`, 30 Tage, nur einmal nutzbar)
  funktionieren bis zu ihrem Ablauf weiter. Neue Links sind immer dauerhaft.
- „Einladungen generieren" (Gruppenliste oben) erzeugt dauerhafte Links für alle
  Gruppen mit Kontaktadresse, die noch nichts eingereicht haben, als CSV — ebenfalls
  nur einmal sichtbar.
- **Das Skript `scripts/generate-invites.ts` NICHT benutzen** — es erzeugt alte
  Einmal-Links und braucht eine Kontaktliste außerhalb des Repos.
