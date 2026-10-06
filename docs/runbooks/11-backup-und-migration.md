<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Backup ziehen, Datenbank-Migration einspielen, im Notfall zurück

**Stand: Oktober 2026** (nach Umsetzungsplan Phase 1–5). **Nur für Personen mit
Zugriff auf die Produktionsdatenbank.** Eine KI darf diese Schritte nicht selbst
ausführen (Umsetzungsplan §1, Regel 2 und 3).

## Wann brauche ich das?

- Ein gemergter Pull Request bringt eine **neue Migration** mit (neuer Ordner unter
  `prisma/migrations/`). Die PR-Beschreibung sagt das; die Admin-App zeigt sonst nach
  dem Deploy Fehler (Login, Gruppenbearbeitung).
- Vor riskanten Aufräumaktionen (Gruppen löschen/zusammenführen, `scripts/cleanup.ts --apply`).
- Regelmäßig als Sicherung (Vorschlag: monatlich und vor der Erstiwoche; Aufbewahrung laut
  [Löschkonzept](../datenschutz-loeschkonzept.md): 90 Tage rollierend 🧑).

## Zwei Arten von Backup — nicht verwechseln

| | **JSON-Backup** (Admin-App) | **Datenbank-Dump / Anbieter-Snapshot** |
|---|---|---|
| Wie | Admin-App → Dashboard → **„Backup herunterladen“** (nur SUPER_ADMIN) | `pg_dump` mit der Direkt-Verbindung, oder Snapshot/Restore-Funktion des DB-Anbieters (Vercel Postgres/Neon) |
| Enthält | Gruppen, Kategorien, Self-Ratings + Antworten, Kontakte, Einladungen, Bearbeitungslinks (Hashes), Änderungsprotokoll, Admins **ohne** Passwort-Hashes | **alles**, inkl. Passwort-Hashes, Schema und Migrationsstand |
| Wofür gut | Nachweis/Archiv; Notfallweg für die Website (`static-site/scripts/export-from-backup.mjs`, Runbook 01) | **Echte Wiederherstellung** der Datenbank |
| Einspielen | Es gibt **kein** Import-Werkzeug | `psql`/`pg_restore` bzw. Anbieter-Restore |

⚠️ **Beide Backups enthalten personenbezogene Daten und gültige Tokens.** Nie ins Repo,
nie in GitHub-Issues/Chats, nie einer KI zum Lesen geben. Ablage nur an dem Ort, den das
Löschkonzept festlegt; nach Fristende löschen.

**Vor einer Migration** reicht das JSON-Backup allein **nicht** als Rückweg: Mit ihm lässt
sich die Datenbank nicht automatisch wiederherstellen. Vorher also zusätzlich einen
Dump ziehen oder prüfen, dass der DB-Anbieter einen Wiederherstellungspunkt anbietet
(bei Neon: „Restore“/„Branch from point in time“; das Zeitfenster hängt vom Tarif ab).

## A) Backup ziehen

1. **JSON:** Admin-App (fomo-pi.vercel.app/admin) → Dashboard → „Backup herunterladen“.
   Datei sicher ablegen (Dateiname enthält das Datum).
2. **Dump** (Rechner mit PostgreSQL-Client-Tools, Version passend zur Datenbank, z. B. 16):
   ```bash
   pg_dump "<DIRECT_URL der Produktion>" --format=custom --file=fomo-<datum>.dump
   ```
   Die `DIRECT_URL` (nicht die „pooled“-URL) steht im Vercel-Projekt `fomo` unter
   Settings → Environment Variables bzw. im Datenbank-Dashboard. Nicht in Dateien im
   Repo-Ordner speichern.

## B) Migration einspielen (nach dem Merge eines PRs mit neuer Migration)

Reihenfolge ist wichtig:

1. **Backup** (Abschnitt A). Ohne frisches Backup nicht weitermachen.
2. **Deploy abwarten:** Vercel → Projekt `fomo` → Deployments → der neueste
   Production-Deploy muss den gemergten Commit zeigen und „Ready“ sein.
   (Ist Vercel gerade „rate limited“, erst warten und den Deploy dann von Hand
   starten: Deployments → ⋯ → „Redeploy“.)
3. Auf einem Rechner mit Node.js 24 und dem aktuellen `main`:
   ```bash
   git pull && npm ci
   export DATABASE_URL="<Produktions-URL>" DIRECT_URL="<Produktions-Direkt-URL>"
   npm run db:status      # zeigt, welche Migrationen fehlen
   npm run db:migrate     # spielt sie ein (= prisma migrate deploy)
   npm run db:status      # muss jetzt „Database schema is up to date“ melden
   ```
   Die Variablen nur in der Shell setzen, **nicht** in eine `.env`-Datei im Repo
   schreiben; das Terminal danach schließen.
4. **Kurztest:** Admin-Login, eine Gruppe öffnen und speichern, „Änderungen“ ansehen,
   Impressum/Datenschutz der Admin-App, Bearbeitungslink einer Testgruppe öffnen.

**Zwischen Schritt 2 und 3 so wenig Zeit wie möglich lassen.** Der neue Code erwartet
das neue Schema; bis zur Migration funktionieren Admin-Login und Gruppenbearbeitung
nicht. Die **öffentliche Website** ist davon nicht betroffen (sie hat keine Datenbank).

### Stand Oktober 2026: Migrationen aus PR #3

PR #3 (Umbau Phase 1–5) bringt vier Migrationen mit:

| Ordner | Was sie tut | Umkehrbar? |
|---|---|---|
| `20261003165536_add_group_change_log` | Tabelle für das Änderungsprotokoll | ja (nur neu) |
| `20261003170344_add_group_edit_tokens` | Tabelle für dauerhafte Bearbeitungslinks | ja (nur neu) |
| `20261003183228_drop_legacy_tables` | **Löscht** Pilot-, Studie-2-, Alt-Quiz- und CMS-Tabellen sowie zwei alte Spalten an `groups` | **nein — nur per Backup** |
| `20261003183729_login_attempts_and_lowercase_admin_emails` | Tabelle für die Login-Sperre; Admin-E-Mails werden klein geschrieben | Tabelle ja; Kleinschreibung praktisch egal |

Die gelöschten Daten wurden vorher außerhalb des Repos archiviert (WP-5.1).

## C) Wenn etwas schiefgeht

| Situation | Was tun |
|---|---|
| `db:migrate` bricht mit Fehler ab | Meldung kopieren, **nichts weiter versuchen**. `npm run db:status` zeigt, welche Migration hängt. Technische Hilfe holen; mit dem Dump ist nichts verloren. |
| „P3009 … failed migrations“ | Eine frühere Migration ist halb gelaufen. Nicht `migrate reset` ausführen (löscht alles). Technische Hilfe holen. |
| Admin-App nach der Migration kaputt, Ursache unklar | Vercel → Deployments → vorherigen Deploy „Promote to Production“ **und** Datenbank aus dem Dump/Snapshot zurückspielen. Nur eins von beiden zurückzudrehen passt nicht zusammen. |
| Daten versehentlich gelöscht (eine Gruppe, Kontakte) | Erst „Änderungen“ → „Rückgängig“ prüfen (deckt Bearbeitungen ab, nicht Löschungen). Sonst Werte aus dem JSON-Backup von Hand wieder eintragen. Ganze DB nur im Notfall zurückspielen. |

**Datenbank aus einem Dump zurückspielen** (überschreibt den aktuellen Stand!):
```bash
pg_restore --clean --if-exists --no-owner --dbname "<DIRECT_URL>" fomo-<datum>.dump
```
Danach `npm run db:status` und den Kurztest aus B.4.

## Was eine KI hier darf

Migrationen **erzeugen und lokal testen** (`npx prisma migrate dev` gegen die
Docker-Datenbank) ja. Gegen die Produktion ausführen, Backups lesen oder Produktions-URLs
verwenden: nein (technisch gesperrt in `.claude/settings.json`).
