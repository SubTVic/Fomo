<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Website-Text oder Quiz-Frage ändern

**Stand: Oktober 2026.**

Betrifft nur die **statische Seite** (`static-site/`). Geht über den GitHub-Webeditor,
kein Terminal nötig — aber immer auf einem **Branch + Pull Request**, nie direkt auf
`main`.

## A) Text auf der Startseite ändern

- Startseiten-Texte (DE **und** EN): `static-site/src/components/HomePageContent.tsx`
  (beide Sprachen in einer Datei, an zwei Stellen).
- Meta-Beschreibung (Google-Snippet): zusätzlich `static-site/src/app/layout.tsx` und
  `static-site/src/app/en/page.tsx`.
- FAQ: `static-site/src/lib/faq.ts`.
- Impressum/Datenschutz: `static-site/src/app/impressum/page.tsx` bzw.
  `…/datenschutz/page.tsx`.

Vorgehen: Datei auf GitHub öffnen → Stift → Text **nur zwischen den Anführungszeichen**
ändern → „Commit" auf einen neuen Branch → Pull Request → CI (grüner Haken) und
Preview-Deploy ansehen → Merge. Ein Syntaxfehler lässt CI und Build scheitern; dann
bleibt die alte Seite online.

> Achtung: Zahlen wie „21 Fragen" oder „über 90 Gruppen" stehen an mehreren Stellen
> hartkodiert. Wenn sich so eine Zahl ändert, alle Vorkommen suchen (GitHub-Suche).

## B) Quiz-Frage umformulieren (nur Wortlaut, gleiche Bedeutung)

Eine Frage steht an **drei** Stellen, die zusammenpassen müssen:
1. `static-site/data/quiz.json` — deutscher Text (Feld `text` beim passenden `WS2-xx`).
2. `static-site/src/lib/quiz-translations.ts` — englische Fassung (nach Item-ID).
3. `data/working-set-v2.json` (Repo-Root, **Registrierungs-App**) — damit Gruppen und
   Studis denselben Text sehen. **Pflicht:** Die CI prüft, dass beide Dateien gleich
   sind (`scripts/check-items-sync.mjs`); fehlt Schritt 3, wird der PR rot.

Optional: Eintrag mit Datum in `static-site/data/report-milestones.json`, damit der
Report die Änderung ab diesem Datum getrennt ausweist.

Vorgehen: Branch → in `quiz.json`, `working-set-v2.json` und `quiz-translations.ts`
ändern → PR → CI grün (baut die Seite, prüft Daten und Item-Gleichheit) → Merge.

## ⚠️ Was NICHT ohne technische Begleitung tun

- **Keine Frage hinzufügen/löschen und keine Item-ID oder Reihenfolge ändern.**
  Geteilte Ergebnis-Links (`?r=`) und der Report kodieren positionsbasiert und werden
  sonst **still falsch** interpretiert; bestehende Gruppen-Ratings verwaisen. Das ist
  ein Code-/Daten-Migrationsthema (siehe Audit §5, Aufgabe 7).
- **Keine Filter umbenennen/umsortieren** — dieselben Link-/Report-Probleme, und ein
  umbenannter Filter schließt Gruppen mit altem Filternamen aus dem Matching aus.
- Bedeutung/Richtung einer Frage ändern heißt: bestehende Gruppen-Antworten passen
  nicht mehr. Dann sollten die Gruppen neu bewerten.

## Konsistenz-Check

Läuft automatisch in der CI (Job `root`, Schritt „Quiz items in sync"): IDs,
Reihenfolge, Texte, Kurztitel, Matching-Attribute und Filter von
`data/working-set-v2.json` und `static-site/data/quiz.json` müssen gleich sein.
Lokal: `node scripts/check-items-sync.mjs`.
