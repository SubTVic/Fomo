<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Eine Gruppe ändert ihre Daten (Attribute, Beschreibung, Kontakt, Logo)

**Stand: Oktober 2026** (nach Umsetzungsplan Phase 1–3 und WP-4.1). Was sich mit Phase 4
ändert, steht unter „Nach dem Umbau".

## Wichtig vorab (sonst geht die Änderung schief oder verloren)

- Gruppendaten leben in der **Datenbank der Admin-App**, nicht in der Website-Datei.
  Eine Korrektur **direkt in `static-site/data/groups.json`** wird beim nächsten
  Daten-Sync **überschrieben**. → Immer über die Admin-App gehen.
- **Quiz-Antworten (die 21 Fragen) und Aktivitäts-Filter kann die Gruppe nur selbst
  über ihren Bearbeitungslink ändern** — es gibt dafür keine Admin-Maske.
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
   dort nicht, nur in Suchergebnissen/Karten.
4. Weiter mit „Daten live schalten" unten.

## Fall B: Quiz-Antworten oder Filter ändern (braucht Bearbeitungslink)

1. Admin-App → „Gruppen" → bei der Gruppe auf **„Einladen"** → **„Link erstellen"**.
   Der Link erscheint **einmal** — kopieren.
2. Den Link **selbst per Mail** an die Gruppe schicken (die App versendet nichts!).
   Nur an eine hinterlegte Adresse. Der Link ist wie ein Passwort.
3. Die Gruppe öffnet den Link, ändert ihre Antworten/Filter (bisherige Antworten sind
   vorausgefüllt) und sendet ab (~5 Min). Der Link gilt **30 Tage** und funktioniert
   **nur einmal**.
4. **Danach in der Admin-App:** unter **„Änderungen"** prüfen, was die Gruppe geändert
   hat → „Gesehen" (oder „Rückgängig", falls etwas nicht stimmt). War die Gruppe noch
   **unbestätigt**: Filter „Eingereicht" → Gruppe öffnen → **„Verifizieren"**.

Website und Instagram dürfen die Gruppen auch ohne `https://` eingeben
(`verein.de`, `@verein`) — die App ergänzt das beim Speichern. Ungültige Angaben
werden rot am jeweiligen Feld angezeigt; der Link bleibt dabei gültig.

## Fall C: Logo ändern/hinzufügen

Logos laufen **nicht** über die DB, sondern direkt über die Website-Dateien:
1. Logo (PNG/SVG, quadratisch) nach `static-site/public/group-logos/` hochladen
   (GitHub: „Add file → Upload files", auf einem Branch).
2. In `static-site/data/logos.json` eine Zeile ergänzen:
   `"gruppen-slug": "/group-logos/dateiname.png"` (Slug = Teil der Profil-URL
   `/groups/<slug>/`; Leerzeichen als `%20`).
3. PR → Merge (siehe unten).

## Daten live schalten (nach Fall A oder B)

Braucht einen Rechner mit Node.js + das Repo:
1. Admin-App → Dashboard → **„Backup herunterladen"** (JSON). ⚠️ **Enthält
   persönliche Daten + Tokens — niemals ins Repo/GitHub!**
2. Im Repo:
   ```
   cd static-site
   node scripts/export-from-backup.mjs --backup <pfad/zum/backup.json>
   node scripts/validate-data.mjs
   ```
   `validate-data.mjs` muss ohne Fehler durchlaufen (Warnungen sind ok). Dieselbe
   Prüfung läuft auch automatisch vor jedem Build — kaputte Daten gehen nicht live.
3. Logos/EN-Texte, die nur in den Website-Dateien stehen, bei Bedarf nachziehen.
4. `static-site/data/groups.json` **auf einem Branch** committen → Pull Request →
   CI muss grün sein → Review → Merge nach `main`. Vercel baut, nach ~2 Min live.
5. Gegencheck auf www.fomo-dresden.app: Gruppe korrekt, nicht als „unbestätigt"
   markiert, im Quiz auffindbar.

## Was schiefgehen kann

- „Profil gespeichert", aber live nichts geändert → Export/Commit vergessen, oder
  Hand-Edit in `groups.json` wurde vom Export überschrieben.
- Gruppe nicht im Quiz → sie war noch unbestätigt und wurde nach der Einreichung
  nicht „verifiziert".
- Build/CI rot mit „Datenprüfung FEHLGESCHLAGEN" → die Meldung nennt Gruppe und Feld.
  In der Admin-App korrigieren und neu exportieren — **nicht** `groups.json` von Hand
  ändern.

## Nach dem Umbau (Umsetzungsplan Phase 4)

- WP-4.2/4.3: Dauerhafter, selbst anforderbarer Bearbeitungslink statt Einmal-Link.
- WP-4.5: Daten-Sync per GitHub Action statt Backup → Terminal → Commit.
