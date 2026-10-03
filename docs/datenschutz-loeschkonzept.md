<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Löschkonzept FOMO (Admin-App)

**Stand: Oktober 2026 (Umsetzungsplan WP-5.5).**

> 🧑 **Entwurf.** Fristen und Zuständigkeiten sind **Vorschläge** und müssen mit dem StuRa
> (Datenschutz) abgestimmt werden. Was schon technisch umgesetzt ist, steht in der
> Spalte „Wie gelöscht“.

Die öffentliche Seite (`static-site/`) speichert keine personenbezogenen Daten. Sie
nutzt nur anonyme Statistik (Umami), siehe `static-site/docs/DATEN-SAMMELN-KONZEPT.md`.
Dieses Konzept betrifft die **Admin-App** (Registrierung, Bearbeitungslinks, Verwaltung)
und ihre Datenbank.

## Datenarten und Fristen

| Daten | Zweck | Frist (Vorschlag) | Wie gelöscht |
|---|---|---|---|
| **Kontaktpersonen** der Gruppen (`GroupContact`: Name, E-Mail, Rolle) | Rückfragen zum Gruppenprofil | Solange die Person für die Gruppe ansprechbar ist. Auf Wunsch sofort. Jährlich vor der Erstiwoche prüfen 🧑 | **Von Hand:** Admin-App → Kontakte → „Löschen“ (nur SUPER_ADMIN) |
| Interne Ansprechperson im Gruppenprofil (`contactPerson`, `contactPersonRole`) | wie oben | wie oben | Von Hand: Gruppe bearbeiten, Feld leeren |
| **Öffentliche Kontaktdaten** der Gruppe (Kontakt-E-Mail, Website, Instagram) | Erscheinen auf der Website | Solange die Gruppe gelistet ist | Gruppe ändert sie per Link; Admin kann sie leeren; Gruppe löschen (nur SUPER_ADMIN) |
| **Gruppenprofil** samt Selbsteinschätzung | Verzeichnis und Quiz | Solange die Gruppe existiert. Inaktive Gruppen nach 🧑 _x_ Jahren löschen | Von Hand: Gruppe löschen (nur SUPER_ADMIN) |
| **Bearbeitungslinks** (`GroupEditToken`; nur Hash gespeichert) | Gruppen ändern ihr Profil | **30 Tage** nach Ablauf (12 Monate) oder Widerruf | **Automatisch:** `scripts/cleanup.ts` |
| **Alte Einmal-Links** (`GroupInvite`; Token, ggf. E-Mail) | Ursprüngliche Einladungen 2026 | **30 Tage** nach Benutzung oder Ablauf | **Automatisch:** `scripts/cleanup.ts` |
| **Fehlgeschlagene Logins** (`LoginAttempt`; nur Hash der E-Mail) | Schutz vor Passwort-Raten | **1 Tag** | **Automatisch:** beim nächsten Fehlversuch und per `scripts/cleanup.ts` |
| **Änderungsprotokoll** (`GroupChangeLog`; alte/neue Werte, E-Mail des prüfenden Admins) | Nachvollziehen, Rückgängig machen | Vorschlag: **12 Monate** 🧑 | Noch nicht automatisiert (nach Abstimmung in `src/lib/cleanup.ts` ergänzen) |
| **Admin-Konten** (E-Mail, Name, Passwort-Hash, letzter Login) | Zugang zur Verwaltung | Bis zum Ausscheiden | Von Hand: Runbook `docs/runbooks/10-admins-verwalten.md` |
| **Backups** (JSON aus „Backup herunterladen“, Server-Backups) | Wiederherstellung | Vorschlag: **90 Tage** rollierend 🧑 | Ablage und Löschung durch die zuständige Person (Phase 6: WP-6.5) |
| **Archiv Pilot/Studie 2** (Backup vom 03.10.2026, außerhalb des Repos) | Nachweis der Studien | 🧑 Frist festlegen (WP-5.1) | Von Hand durch die zuständige Person |
| Server-Logs des Hostings | Betrieb, Fehlersuche | Laut Anbieter (Vercel), später StuRa-Server 🧑 | Durch den Anbieter |

Pilot, Studie 2 und das alte Quiz sind seit WP-5.3 **nicht mehr in der Datenbank**.

## Automatische Löschung

```bash
DATABASE_URL="<url>" npx tsx scripts/cleanup.ts            # Probelauf: zählt nur
DATABASE_URL="<url>" npx tsx scripts/cleanup.ts --apply    # löscht
```
Läuft bis zum Umzug von Hand (z. B. monatlich, durch eine Person mit DB-Zugang). Auf
dem StuRa-Server läuft es täglich als Cron-Job (Phase 6). Logik und Fristen stehen in
`src/lib/cleanup.ts`.

## Anfragen von Betroffenen (Auskunft, Löschung)

1. Anfragen gehen an **fomo@yeti-dresden.org** (🧑 nach der Übergabe: Adresse des StuRa).
2. Ein SUPER_ADMIN sucht die Person unter **Kontakte**. Bei Bedarf auch im Gruppenprofil
   (interne Ansprechperson) und unter **Admins**.
3. **Auskunft:** gespeicherte Angaben aus der Kontaktliste mitteilen.
   **Löschung:** Kontakt löschen bzw. Felder leeren. Ältere Werte stehen ggf. noch im
   Änderungsprotokoll und in Backups; sie verschwinden mit deren Frist.
4. Antwort an die Person, spätestens nach einem Monat (Art. 12 DSGVO).
