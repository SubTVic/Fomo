<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Eine Gruppe ändert ihre Daten (Attribute, Beschreibung, Kontakt, Logo)

**Stand: Oktober 2026** (nach Umsetzungsplan Phase 1–5). Was noch kommt, steht unter
„Noch offen".

## Wichtig vorab (sonst geht die Änderung schief oder verloren)

- Gruppendaten leben in der **Datenbank der Admin-App**, nicht in der Website-Datei.
  Eine Korrektur **direkt in `static-site/data/groups.json`** wird beim nächsten
  Daten-Sync **überschrieben**. → Immer über die Admin-App gehen.
- **Quiz-Antworten (die 21 Fragen) und Aktivitäts-Filter** ändert am besten die Gruppe
  selbst über ihren Bearbeitungslink. Für kleine Korrekturen (z. B. ein falsch gesetzter
  Filter) können Admins sie auf der Gruppenseite unter **„Quiz-Profil"** bearbeiten —
  das landet im Änderungsprotokoll. **Keine Antworten erfinden.**
- **Verifizierte Gruppen bleiben verifiziert, wenn sie etwas korrigieren** (Entscheidung
  E1). Die Änderung geht beim nächsten Daten-Sync live. Admins sehen jede Änderung unter
  **„Änderungen"** (Vorher/Nachher) und können sie mit **„Rückgängig"** zurücknehmen.
- **Unbestätigte Gruppen** müssen nach ihrer Einreichung weiterhin von einem Admin
  **verifiziert** werden, sonst kommen sie nicht ins Quiz.

## Fall A: Nur Stammdaten ändern (Beschreibung, Kontakt-Mail, Website, Kategorie …)

1. In der Admin-App einloggen (fomo-pi.vercel.app/admin, Zugang beim StuRa/YETI).
2. „Gruppen" → die Gruppe suchen → öffnen → Felder ändern → speichern.
3. **Hinweis:** Auf der öffentlichen Detailseite erscheint im Fließtext nur die
   **lange** Beschreibung (`longDescription`). Eine neue **Kurz**beschreibung sieht man
   dort nicht, nur in Suchergebnissen/Karten. Beide Beschreibungen kann die Gruppe auch
   selbst über ihren Link ändern („Nur Gruppeninfos ändern"); leere Felder werden dabei
   gelöscht.
4. Weiter mit „Daten live schalten" unten.

## Fall B: Quiz-Antworten oder Filter ändern (braucht Bearbeitungslink)

1. Hat die Gruppe ihren **dauerhaften Bearbeitungslink** noch, reicht der. Sonst:
   Admin-App → „Gruppen" → **„Bearbeitungslink"** → **„Link erzeugen"** (Details und
   Mustertext: [Runbook 03](03-link-verloren.md)). Der Link erscheint **nur einmal**.
2. Den Link per **„Mail an …"** bzw. selbst per Mail schicken (die App versendet
   nichts). Nur an eine hinterlegte Adresse. Der Link ist wie ein Passwort.
3. Die Gruppe öffnet den Link, ändert ihre Antworten/Filter (bisherige Antworten sind
   vorausgefüllt) und sendet ab (~5 Min) — oder wählt **„Nur Gruppeninfos ändern"**.
   Der Link gilt **12 Monate** und funktioniert **mehrfach**.
4. **Danach in der Admin-App:** unter **„Änderungen"** prüfen, was die Gruppe geändert
   hat → „Gesehen" (oder „Rückgängig", falls etwas nicht stimmt). War die Gruppe noch
   **unbestätigt**: Filter „Eingereicht" → Gruppe öffnen → **„Verifizieren"**.

Website und Instagram dürfen die Gruppen auch ohne `https://` eingeben
(`verein.de`, `@verein`) — die App ergänzt das beim Speichern. Ungültige Angaben
werden rot am jeweiligen Feld angezeigt; der Link bleibt dabei gültig. Auch der
Daten-Sync ergänzt fehlendes `https://`. Bleibt trotzdem ein unvollständiger Link bei
einer **verifizierten** Gruppe übrig, bricht die Datenprüfung ab (siehe unten).

## Fall C: Logo ändern/hinzufügen

Logos laufen **nicht** über die DB, sondern direkt über die Website-Dateien:
1. Logo (PNG/SVG, quadratisch) nach `static-site/public/group-logos/` hochladen
   (GitHub: „Add file → Upload files", auf einem Branch).
2. In `static-site/data/logos.json` eine Zeile ergänzen:
   `"gruppen-slug": "/group-logos/dateiname.png"` (Slug = Teil der Profil-URL
   `/groups/<slug>/`; Leerzeichen als `%20`).
3. PR → Merge (siehe unten).

## Daten live schalten (nach Fall A oder B) — „Daten-Sync"

Kein Terminal, kein Backup nötig. Am besten **gesammelt** (z. B. einmal pro Woche oder
nach einer Bestätigungsrunde):
1. Admin-App → Dashboard → **„Daten-Sync öffnen (GitHub)"** (oder GitHub → Actions →
   „Daten-Sync") → **„Run workflow"** → grüner Knopf „Run workflow".
2. Nach ~1 Minute entsteht ein **Pull Request „Daten-Sync <Datum>"**. Er listet, welche
   Gruppen neu sind, entfernt wurden oder sich geändert haben (welche Felder).
   Gibt es nichts Neues, entsteht kein PR.
3. Prüfungen (CI) abwarten → grün → kurz in die Vorschau schauen → **Merge**.
   Vercel baut, ~2 Minuten später ist es live.
4. Gegencheck auf www.fomo-dresden.app: Gruppe korrekt, nicht als „unbestätigt"
   markiert, im Quiz auffindbar.

Logos und EN-Texte stehen nicht in der Datenbank — die bei Bedarf separat nachziehen
(Fall C, `static-site/data/group-translations.json`).

**Der Sync bricht ab**, wenn mehr als 20 % der veröffentlichten Gruppen wegfallen würden
(Schutz vor einer falschen/leeren Datenbank). Ist das gewollt (z. B. große
Aufräumaktion), beim Starten den Haken „Auch syncen, wenn mehr als 20 % … wegfallen"
setzen.

**Einrichtung (einmalig, durch eine Person mit Zugriff):** ein langes Zufalls-Token
erzeugen (`openssl rand -base64 48`) und **gleich** eintragen als
(a) Umgebungsvariable `EXPORT_TOKEN` im Vercel-Projekt der Admin-App und
(b) GitHub → Settings → Secrets and variables → Actions → Secret `EXPORT_TOKEN`.
Außerdem GitHub → Settings → Actions → General → „Allow GitHub Actions to create and
approve pull requests" einschalten. Läuft die Admin-App woanders, die Actions-Variable
`EXPORT_URL` auf `<App-URL>/api/admin/export/static-groups` setzen.

### Notfallweg (wenn GitHub Actions oder der Export-Endpunkt nicht gehen)

Braucht einen Rechner mit Node.js + das Repo:
1. Admin-App → Dashboard → **„Backup herunterladen"** (JSON, nur als SUPER_ADMIN). ⚠️ **Enthält
   persönliche Daten + Tokens — niemals ins Repo/GitHub!**
2. Im Repo:
   ```
   cd static-site
   node scripts/export-from-backup.mjs --backup <pfad/zum/backup.json>
   node scripts/validate-data.mjs
   ```
3. `static-site/data/groups.json` **auf einem Branch** committen → Pull Request →
   CI grün → Merge. Backup-Datei danach löschen.

## Was schiefgehen kann

- „Profil gespeichert", aber live nichts geändert → Daten-Sync nicht gestartet oder
  dessen PR nicht gemergt, oder ein Hand-Edit in `groups.json` wurde vom Export
  überschrieben.
- Daten-Sync rot im Schritt „Export holen" → Secret `EXPORT_TOKEN` fehlt oder passt
  nicht zur Vercel-Variable; im Schritt „Daten prüfen" → die Meldung nennt Gruppe und
  Feld.
- Gruppe nicht im Quiz → sie war noch unbestätigt und wurde nach der Einreichung
  nicht „verifiziert".
- Build/CI rot mit „Datenprüfung FEHLGESCHLAGEN" → die Meldung nennt Gruppe und Feld.
  In der Admin-App korrigieren und neu exportieren — **nicht** `groups.json` von Hand
  ändern.

## Noch offen

- WP-4.3: Gruppen fordern ihren Link selbst per Mail an (wartet auf Entscheidung E3,
  Mailserver).
- Phase 6 (Umzug auf den StuRa-Server): Der Daten-Sync wird dort ein Knopf
  „Website aktualisieren“ in der Admin-App (WP-6.4).
