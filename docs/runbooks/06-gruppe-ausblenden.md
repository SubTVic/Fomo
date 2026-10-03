<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Gruppe ausblenden oder aufgelöste Gruppe entfernen

**Stand: Oktober 2026.**

Eine Gruppe verschwindet von der Website, wenn sie in der **Admin-App deaktiviert** ist
und danach einmal exportiert wird. **Nicht** die Gruppe aus `static-site/data/groups.json`
löschen — der nächste Export holt sie sonst zurück.

## Schritte

1. Admin-App (fomo-pi.vercel.app/admin) → „Gruppen" → Gruppe öffnen.
2. **„Deaktivieren"** klicken. (Nicht „Löschen": Deaktivieren ist umkehrbar und
   behält Verlauf und Kontakte.)
3. Daten live schalten wie in [Runbook 01, „Daten live schalten"](01-gruppe-aendern.md#daten-live-schalten-nach-fall-a-oder-b).
4. Gegencheck: Die Gruppe fehlt auf www.fomo-dresden.app/groups/ und im Quiz.

## Sonderfall Duplikat

Steht dieselbe Gruppe zweimal da (z. B. `…-2`), die **unvollständigere** Kopie
deaktivieren. Die Datenprüfung warnt bei jedem Build vor möglichen Duplikaten
(„mögliches Duplikat … eine Kopie in der Admin-App deaktivieren").

## Wieder einblenden

Gleiche Schritte, Knopf heißt dann „Aktivieren".
