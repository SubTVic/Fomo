<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbooks — welche Anleitung für welche Aufgabe?

**Stand: Oktober 2026.** Je Aufgabe eine kurze Schritt-für-Schritt-Anleitung.
Grundregel für alles: Gruppendaten ändert man in der **Admin-App**
(fomo-pi.vercel.app/admin), nie direkt in `static-site/data/groups.json`; Code und
Texte nur über **Branch + Pull Request**.

| # | Aufgabe | Runbook | Ohne Technik machbar? |
|---|---|---|---|
| 1 | Gruppe ändert Beschreibung, Kontakt, Antworten oder Logo | [01 Gruppe ändern](01-gruppe-aendern.md) | Admin-App ja; „Daten live schalten" braucht Node.js |
| 2 | Neue Gruppe ins Quiz bringen | [02 Neue Gruppe](02-neue-gruppe.md) | wie 1 |
| 3 | Gruppe ausblenden / aufgelöst | [06 Gruppe ausblenden](06-gruppe-ausblenden.md) | wie 1 |
| 4 | Gruppe hat ihren Link verloren | [03 Link verloren](03-link-verloren.md) | ja (Admin-Login) |
| 5 | Text auf der Website ändern | [04 Text/Frage ändern, Teil A](04-text-und-frage-aendern.md#a-text-auf-der-startseite-ändern) | ja (GitHub-Webeditor) |
| 6 | Quiz-Frage umformulieren | [04 Text/Frage ändern, Teil B](04-text-und-frage-aendern.md#b-quiz-frage-umformulieren-nur-wortlaut-gleiche-bedeutung) | ja (GitHub-Webeditor) |
| 7 | Frage/Filter hinzufügen, löschen, umbenennen | [07 Quiz-Item ändern](07-quiz-item-aendern.md) | nein |
| 8 | Jährliche Bestätigungsrunde | [08 Bestätigungsrunde](08-jaehrliche-bestaetigungsrunde.md) | Admin-App ja; Live schalten wie 1 |
| 9 | Statistik ansehen | [09 Statistik](09-statistik.md) | ja |
| 10 | Admin hinzufügen/entfernen | [10 Admins verwalten](10-admins-verwalten.md) | ja (SUPER_ADMIN) |
| 11 | „Etwas ist kaputt" / Deployment | [05 Fehlersuche und Deploy](05-fehlersuche-und-deploy.md) | Diagnose ja, Behebung teils nein |
| 12 | Software-Updates | [12 Updates](12-updates.md) | nein |

Weitere Doku: Betrieb ohne Programmierkenntnisse →
[`static-site/docs/BETRIEBSHANDBUCH.md`](../../static-site/docs/BETRIEBSHANDBUCH.md);
mit KI arbeiten → [`static-site/docs/KI-MITARBEIT.md`](../../static-site/docs/KI-MITARBEIT.md);
offene Aufgaben → [`TODO.md`](../../TODO.md).
