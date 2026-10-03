<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Neue Hochschulgruppe aufnehmen

**Ziel:** Die Gruppe soll im **Quiz** auftauchen. Das geht **nur**, wenn die Gruppe
ihr Profil (21 Fragen + Filter) selbst ausfüllt — erfundene Antworten verfälschen das
Matching aller Gruppen. Deshalb gibt es zwei Wege, beide enden mit „verifizieren +
exportieren".

## Weg 1: Die Gruppe registriert sich selbst (bevorzugt)

1. Der Gruppe den Link schicken: **www.fomo-dresden.app → „Gruppe registrieren"**
   (führt auf fomo-pi.vercel.app/groups/register).
2. Die Gruppe füllt das 6-Schritte-Formular aus: Stammdaten, Kontakt, Struktur,
   **Gruppencheck (21 Fragen)**, verantwortliche Person, Einwilligung.
3. Die Gruppe landet als **inaktiv + unbestätigt** in der Admin-App.
4. Admin-App → „Gruppen" → neue Gruppe öffnen → prüfen → **aktivieren** (Status) →
   **verifizieren**.
5. Daten live schalten (Backup → Export → Commit, siehe Runbook 01, Abschnitt „Daten
   live schalten").

## Weg 2: Admin legt an + lädt die Gruppe zum Gruppencheck ein

1. Admin-App → „Gruppen" → **„+ Neue Gruppe"** → Name, Kurzbeschreibung, Kategorie,
   Mail. (Das legt nur Stammdaten an — **noch kein Quiz-Profil**.)
2. Bei der Gruppe **„Einladen" → „Link erstellen"** → Link kopieren → **selbst per Mail**
   schicken.
3. Die Gruppe füllt über den Link die 21 Fragen + Filter aus.
4. Admin-App → prüfen → **verifizieren**.
5. Daten live schalten (siehe Runbook 01).

## Wenn es schnell nur ins Verzeichnis (nicht ins Quiz) soll

Eine neu angelegte Gruppe ohne eigenes Self-Rating erscheint als **„unbestätigt"** im
Verzeichnis (hinter dem Filter „auch unbestätigte anzeigen"), **nicht** im Quiz. Das
ist beabsichtigt. Ins Quiz kommt sie erst über Weg 1 oder 2.

## Fallen

- **Keine Quiz-Antworten erfinden**, um eine Gruppe „schnell" ins Quiz zu bekommen —
  das verzerrt das Ranking aller Gruppen. Ohne echtes Self-Rating: Verzeichnis, ja;
  Quiz, nein.
- **Nicht** über „CSV neu importieren" anlegen — das ist ein destruktiver Massen-Import
  (überschreibt bestehende Gruppen).
- Slug (URL-Name) nach dem Anlegen **nicht mehr ändern** — sonst brechen Logo-Zuordnung,
  EN-Übersetzung und geteilte Links.
- Nach dem Anlegen prüfen, ob es die Gruppe nicht schon gibt (Duplikat) — die App warnt
  nur intern, blockt aber nicht.
