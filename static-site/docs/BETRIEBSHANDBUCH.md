<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# FOMO Betriebshandbuch — für Nicht-Techniker:innen

Dieses Dokument erklärt, wie man FOMO (www.fomo-dresden.app) **betreibt, ohne
programmieren zu können**. Es ist für die Übergabe an StuRa-Referent:innen oder
Nachfolger:innen geschrieben. Technische Details stehen bewusst NICHT hier —
dafür gibt es `INBETRIEBNAHME.md` und die README.

---

## 1. Was ist FOMO technisch? (in 3 Sätzen)

FOMO ist eine **statische Website**: Sie besteht nur aus fertigen Dateien, hat
keine Datenbank und keinen eigenen Server. Das Quiz-Matching läuft komplett im
Browser der Nutzer:innen — es gibt nichts, das „abstürzen" kann, keine Server
zu warten, keine Sicherheitsupdates einzuspielen. Die laufenden Kosten sind
**0 €** (Vercel Free Tier) plus die Domain (~15 €/Jahr).

## 2. Die Konten (Zugänge, die man braucht)

| Konto | Wofür | Kritisch? |
|---|---|---|
| **GitHub** (`SubTVic/Fomo`) | Hier liegt der gesamte Code + die Gruppendaten | ⭐ Ja — wer das hat, kontrolliert alles |
| **Vercel** | Hosting; baut die Seite bei jeder Änderung automatisch neu | ⭐ Ja |
| **Domain-Registrar** (fomo-dresden.app) | Die Internetadresse; jährliche Verlängerung! | ⭐ Ja — Ablauf = Seite weg |
| **Umami** | Anonyme Statistik (Besucher, Quiz-Antworten) | Nein — Seite läuft auch ohne |
| **E-Mail** fomo@yeti-dresden.org | Kontaktadresse aus Impressum/Landing | Ja (rechtlich: Impressum) |

**Übergabe-Checkliste:** Alle 5 Zugänge übergeben + Impressum aktualisieren
(verantwortliche Person mit Anschrift ändern in
`static-site/src/app/impressum/page.tsx` und `datenschutz/page.tsx`).

## 3. Wie funktionieren Änderungen? (das Grundprinzip)

```
Datei auf GitHub ändern  →  Vercel baut automatisch neu  →  in ~2 Min live
```

Für **alle** Routineänderungen reicht der GitHub-Webeditor (Datei öffnen →
Stift-Symbol → ändern → „Commit changes"). Man braucht keinen eigenen Computer
mit Entwicklungsumgebung. Wenn ein Fehler passiert: Auf GitHub gibt es eine
Historie — jede Änderung lässt sich per „Revert" rückgängig machen, und Vercel
kann per Klick auf ein älteres Deployment zurückschalten
(Deployments → ⋯ → „Promote to Production").

## 4. Die häufigste Aufgabe: Gruppendaten aktualisieren

Alle Inhalte (Gruppen, Beschreibungen, Kontakte) stehen in **einer Datei**:
`static-site/data/groups.json`.

**Einzelne Angabe korrigieren** (z. B. neue E-Mail einer Gruppe):
1. Datei auf GitHub öffnen → Stift → die Stelle suchen (Strg+F, Gruppenname)
2. Wert ändern — nur Text **zwischen den Anführungszeichen** anfassen
3. Commit → fertig. Vercel prüft beim Bauen automatisch, ob die Datei noch
   gültig ist; bei kaputtem JSON schlägt der Build fehl und die **alte Seite
   bleibt einfach online** (nichts geht kaputt).

**Neue Registrierungen einspielen** (aus der Registrierungs-App):
Das ist der einzige Schritt, der einen Computer mit Node.js braucht (einmalige
Einrichtung, dann 2 Kommandos):
```
node scripts/export-from-backup.mjs --backup <backup-datei.json>
node scripts/validate-data.mjs
```
Dann die neue `data/groups.json` committen. ⚠️ Die Backup-Datei selbst enthält
persönliche Daten (Kontakte!) und darf **niemals** auf GitHub hochgeladen
werden — nur die erzeugte `groups.json` ist öffentlich unbedenklich.

**Wichtig zu wissen:** Nur **bestätigte** Gruppen (von der Gruppe selbst
ausgefüllt) erscheinen in den Quiz-Ergebnissen. Gescrapte/unbestätigte Gruppen
sind nur im Verzeichnis unter „Auch unbestätigte Gruppen anzeigen" sichtbar.
Der beste Weg, eine Gruppe „ins Matching zu bringen", ist also: **sie zur
Registrierung bewegen.**

## 5. Logo einer Gruppe hinzufügen

1. Logo-Datei (PNG/SVG, quadratisch am besten) nach
   `static-site/public/group-logos/` hochladen (GitHub: „Add file → Upload files")
2. In `static-site/data/logos.json` eine Zeile ergänzen:
   `"gruppen-slug": "/group-logos/dateiname.png"`
   (Der Slug ist der Namensteil der Profil-URL: `/groups/<slug>/`.
   Leerzeichen im Dateinamen als `%20` schreiben.)

## 6. Texte ändern (Startseite, Quiz-Fragen, Impressum)

| Was | Datei |
|---|---|
| Startseiten-Texte (DE+EN) | `static-site/src/components/HomePageContent.tsx` |
| Quiz-Fragen + Filter (DE) | `static-site/data/quiz.json` |
| Quiz-Fragen (EN) | `static-site/src/lib/quiz-translations.ts` |
| Gruppen-Beschreibungen (EN) | `static-site/src/lib/group-translations.ts` |
| Impressum / Datenschutz | `static-site/src/app/impressum/page.tsx`, `…/datenschutz/page.tsx` |

⚠️ Quiz-Fragen ändern ist heikel: **Formulierung** ändern ist okay; Fragen
**hinzufügen/löschen** verändert das Matching und macht alte geteilte
Ergebnis-Links ungültig — das sollte jemand mit technischem Verständnis
begleiten.

## 7. Statistik lesen (Umami)

Login auf Umami → Website „fomo-dresden.app". Die wichtigsten Zahlen:
- **Besucher/Tag** — Reichweite (für den StuRa-Bericht)
- Event `quiz-complete` vs. `quiz-start` — wie viele ziehen das Quiz durch?
- Event `quiz-item-view` pro Index — bei welcher Frage brechen Leute ab?
- Event `group-click` — welche Gruppen bekommen echte Kontakte? (gut als
  Argument gegenüber Gruppen und StuRa)
- Event `results-feedback` — 👍/👎 auf der Ergebnisseite

Alles ist anonym; es gibt nichts DSGVO-Kritisches zu verwalten, kein
Cookie-Banner, keine Löschanfragen-Prozesse.

**Schöner Bericht statt Umami-Rohdaten — ohne Technik:** Die Live-Seite baut
bei jedem Deployment automatisch einen fertigen Bericht mit Diagrammen und
legt ihn unter **www.fomo-dresden.app/report/** ab: Antworten pro Frage im
Klartext, Abbruch-Kurve, Top-Gruppen in den Ergebnissen, Bias-Analyse. Den
Link kann man direkt an den StuRa weitergeben. (Der Bericht ist öffentlich,
enthält aber nur anonyme Sammelwerte; Google indexiert ihn nicht.)

Damit er echte Zahlen zeigt, müssen im Vercel-Projekt zwei Variablen gesetzt
sein: `UMAMI_API_KEY` und `UMAMI_WEBSITE_ID` (ohne `NEXT_PUBLIC_`-Präfix).
**Aktualität:** Der Bericht erneuert sich bei jedem Deployment; zusätzlich
stößt eine GitHub-Automatik jeden Montag früh ein Deployment an — dafür
einmalig in Vercel einen „Deploy Hook" (Settings → Git) erstellen und die
URL als GitHub-Secret `VERCEL_DEPLOY_HOOK_URL` hinterlegen. Sofort
aktualisieren: GitHub → Actions → „Weekly report redeploy" → „Run workflow".

**Zwei Knöpfe, zwei Zwecke — nicht verwechseln:**

| GitHub-Action | Was sie tut | Was sie NICHT tut |
|---|---|---|
| „**Report erstellen (ohne Deploy)**" | Erzeugt eine **Download-Datei**: fertigen Lauf öffnen → unten „Artifacts" → `fomo-report` (ZIP mit HTML) | Ändert die Website **nicht** — `/report/` bleibt wie er ist |
| „**Weekly report redeploy**" (läuft montags automatisch, geht auch manuell) | Baut die **Website** neu → `/report/` auf fomo-dresden.app wird aktuell | Erzeugt keine Download-Datei |

Einmalige Einrichtung für den Download-Knopf: GitHub → Repo → Settings →
Secrets and variables → Actions → zwei Secrets: `UMAMI_API_KEY` und
`UMAMI_WEBSITE_ID` (dieselben Werte wie in Vercel). Für den Redeploy-Knopf
zusätzlich das Secret `VERCEL_DEPLOY_HOOK_URL` (siehe oben).

Für Fortgeschrittene gibt es den Bericht auch lokal: `npm run report` im
Ordner `static-site/` (Details in der README, Abschnitt „Report generator").

## 8. Wenn etwas nicht funktioniert

| Symptom | Wahrscheinliche Ursache | Lösung |
|---|---|---|
| Seite ganz weg | Domain abgelaufen ODER Vercel-Konto-Problem | Registrar/Vercel-Status prüfen |
| Änderung wird nicht sichtbar | Build fehlgeschlagen | Vercel → Deployments → Log ansehen; meist kaputtes JSON → Änderung auf GitHub reverten |
| Gruppe fehlt im Quiz | Gruppe ist unbestätigt | Registrierung anstoßen (siehe §4) |
| Logo erscheint nicht | Slug/Dateiname in logos.json falsch | Schreibweise + `%20` prüfen |
| Statistik leer | `UMAMI_WEBSITE_ID` fehlt in Vercel | Vercel → Settings → Env Vars, dann Redeploy |

**Eskalation:** Wenn es nicht in dieser Tabelle steht, braucht es jemanden mit
Next.js-Grundkenntnissen (jede:r Informatik-Studi im 3. Semester). Das gesamte
Projekt ist Open Source (AGPL) — es gibt keinen Vendor-Lock-in; im Notfall kann
jede:r Webentwickler:in übernehmen.

## 9. Jährlicher Wartungskalender

| Wann | Was |
|---|---|
| **Jährlich** | Domain-Verlängerung prüfen (Registrar) |
| **Vor Erstiwoche (Sept.)** | Daten aktualisieren (§4), tote Links stichprobenartig prüfen, Umami checken |
| **Nach Erstiwoche** | Bericht sichern: www.fomo-dresden.app/report/ aufrufen und als PDF/HTML speichern → an StuRa |
| **Bei Personenwechsel** | Impressum/Datenschutz aktualisieren (§2), Zugänge übergeben |
| **Montags (automatisch)** | Der /report/ aktualisiert sich per GitHub-Automatik von selbst (§7) |
| **Sonst** | Nichts. Statische Seite = keine Sicherheitsupdates nötig. |
