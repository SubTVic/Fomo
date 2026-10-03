<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Quiz-Frage (Item) oder Filter hinzufügen, löschen, umbenennen

**Stand: Oktober 2026.** **Kein Do-it-yourself-Thema** — braucht technische
Begleitung (Entwickler:in oder KI mit Review). Nur den **Wortlaut** einer Frage zu
ändern, ist einfach: dafür [Runbook 04](04-text-und-frage-aendern.md).

## Warum heikel

- Gruppen und Studis beantworten **dieselben** Items. Eine neue Frage hat für keine
  Gruppe eine Antwort → sie zählt für alle als „neutral", bis die Gruppen nachbewerten.
- Geteilte Ergebnis-Links (`?r=…`) und der Report kodieren die Antworten **nach
  Position**. Eine neue/gelöschte/umsortierte Frage lässt alte Links **still falsch**
  auswerten.
- Item-IDs müssen dem Muster `WS2-\d{2}` folgen, sonst lehnt die Registrierung ab.
- Ein umbenannter Filter schließt Gruppen mit dem alten Filternamen aus.

## Wenn es trotzdem sein muss (Checkliste für die technische Begleitung)

1. Entscheidung dokumentieren (wer, warum) — idealerweise als neues Working Set
   („v3") statt Einzeländerung.
2. Items in **beiden** Quellen ändern: `data/working-set-v2.json` (Registrierung) und
   `static-site/data/quiz.json` (Website) + EN in `static-site/src/lib/quiz-translations.ts`.
   `node scripts/check-items-sync.mjs` (läuft auch in der CI) muss grün sein.
3. Share-Links versionieren (z. B. Präfix im `?r=`-Wert), damit alte Links erkannt werden.
4. Bestehende Gruppen-Antworten migrieren oder Gruppen um Nachbewertung bitten
   ([Runbook 08](08-jaehrliche-bestaetigungsrunde.md)).
5. Tests anpassen (`cd static-site && npm test`), Eintrag in
   `static-site/data/report-milestones.json`, PR mit grüner CI.

Siehe auch Umsetzungsplan „Später / optional: Working-Set v3".
