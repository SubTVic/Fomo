<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Eine Gruppe ändert ihre Daten (Attribute, Beschreibung, Kontakt, Logo)

**Gilt für den HEUTIGEN Stand.** Was sich nach Umsetzung der Audit-Vorschläge
ändert, steht unter „Nach dem Umbau".

## Wichtig vorab (sonst geht die Änderung schief oder verloren)

- Gruppendaten leben in der **Datenbank der Admin-App**, nicht in der Website-Datei.
  Eine Korrektur **direkt in `static-site/data/groups.json`** wird beim nächsten
  Daten-Sync **überschrieben**. → Immer über die Admin-App gehen.
- **Quiz-Antworten (die 21 Fragen) und Aktivitäts-Filter kann die Gruppe nur selbst
  über ihren Bearbeitungslink ändern** — es gibt dafür keine Admin-Maske.
- **Jede neue Einreichung setzt die Gruppe auf „unbestätigt".** Danach **muss** ein
  Admin sie wieder auf „Verifiziert" setzen, sonst fällt sie aus dem Quiz.

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
4. **Danach in der Admin-App:** Filter „Eingereicht" → Gruppe öffnen → prüfen →
   **„Verifizieren"** klicken. **Dieser Schritt ist entscheidend** — ohne ihn fällt die
   Gruppe beim nächsten Export aus dem Quiz.

> ⚠️ Bekannter Bug (bis zum Fix): Wenn die Gruppe nur ein Feld wie Mitgliederzahl
> ändert und ein anderes vorausgefülltes Feld unverändert lässt, kann der alte Wert
> gespeichert werden, obwohl „Profil gespeichert!" erscheint. Im Zweifel die
> Stammdaten nach dem Absenden in der Admin-Maske gegenprüfen (Fall A).

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
   `validate-data.mjs` muss ohne Fehler durchlaufen (Warnungen sind ok).
3. Logos/EN-Texte, die nur in den Website-Dateien stehen, bei Bedarf nachziehen.
4. `static-site/data/groups.json` **auf einem Branch** committen → Pull Request →
   Review → Merge nach `main`. Vercel baut, nach ~2 Min live.
5. Gegencheck auf www.fomo-dresden.app: Gruppe korrekt, nicht als „unbestätigt"
   markiert, im Quiz auffindbar.

## Was schiefgehen kann

- „Profil gespeichert", aber live nichts geändert → Export/Commit vergessen, oder
  Hand-Edit in `groups.json` wurde vom Export überschrieben.
- Gruppe aus dem Quiz verschwunden → nach Einreichung nicht „verifiziert".
- Bearbeiten scheitert mit „Validation failed" → vorausgefüllte Website/Instagram ist
  keine vollständige URL (`https://…`). Erst in der Admin-Maske korrigieren.

## Nach dem Umbau (Audit-Vorschläge A1/A3/A4)

- Daten-Sync per GitHub Action statt Backup→Terminal→Commit.
- Dauerhafter, selbst-anforderbarer Bearbeitungslink statt Einmal-Token.
- Re-Submit setzt die Verifizierung nicht mehr zurück (bzw. 1-Klick-Re-Verify).
