<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# FOMO Betriebshandbuch — für Nicht-Techniker:innen

Dieses Dokument erklärt, wie man FOMO (www.fomo-dresden.app) **betreibt, ohne
programmieren zu können**. Es ist für die Übergabe an StuRa-Referent:innen oder
Nachfolger:innen geschrieben. Technische Details stehen bewusst NICHT hier —
dafür gibt es `INBETRIEBNAHME.md` und die README.

---

## 1. Was ist FOMO technisch? (in 3 Sätzen)

Die **öffentliche Seite** www.fomo-dresden.app ist eine **statische Website**:
fertige Dateien, keine Datenbank, kein eigener Server; das Quiz-Matching läuft im
Browser der Nutzer:innen. **Dahinter** steht aber die **Registrierungs-/Admin-App**
(fomo-pi.vercel.app) mit einer **Datenbank**: Dort registrieren sich Gruppen und
pflegen Admins die Daten. Diese App **braucht Pflege** — Software-Updates (2× im
Jahr, `docs/runbooks/12-updates.md`), Admin-Zugänge, Backups. Laufende Kosten heute:
Vercel- und Datenbank-Gratistarif plus Domain (~15 €/Jahr).

## 2. Die Konten (Zugänge, die man braucht)

| Konto | Wofür | Kritisch? |
|---|---|---|
| **GitHub** (`SubTVic/Fomo`) | Hier liegt der gesamte Code + die Gruppendaten | ⭐ Ja — wer das hat, kontrolliert alles |
| **Vercel** | Hosting beider Apps (`fomo-static` = Website, `fomo` = Admin-App) | ⭐ Ja |
| **Datenbank** (PostgreSQL, über Vercel/Neon) | Gruppendaten, Kontakte, Admins der Admin-App | ⭐ Ja |
| **Admin-App-Login** (fomo-pi.vercel.app/admin) | Gruppen pflegen, verifizieren, Links erzeugen | ⭐ Ja — mind. 2 SUPER_ADMINs |
| **Domain-Registrar** (fomo-dresden.app) | Die Internetadresse; jährliche Verlängerung! | ⭐ Ja — Ablauf = Seite weg |
| **Umami** | Anonyme Statistik (Besucher, Quiz-Antworten) | Nein — Seite läuft auch ohne |
| **E-Mail** fomo@yeti-dresden.org | Kontaktadresse aus Impressum/Landing | Ja (rechtlich: Impressum) |

**Übergabe-Checkliste:** Alle Zugänge übergeben + Impressum aktualisieren
(verantwortliche Person mit Anschrift ändern in
`static-site/src/app/impressum/page.tsx` und `datenschutz/page.tsx`).

## 3. Wie funktionieren Änderungen? (das Grundprinzip)

```
Datei auf GitHub ändern (auf einem Branch)  →  Pull Request  →  automatische
Prüfung (CI) grün  →  Merge  →  Vercel baut neu  →  in ~2 Min live
```

Für Texte reicht der GitHub-Webeditor (Datei öffnen → Stift-Symbol → ändern →
„Commit changes" → **„Create a new branch"** wählen → Pull Request). **Nie direkt
auf `main` speichern** — `main` geht sofort live. Man braucht keinen eigenen
Computer mit Entwicklungsumgebung. Gruppendaten laufen anders (§4). Wenn ein Fehler passiert: Auf GitHub gibt es eine
Historie — jede Änderung lässt sich per „Revert" rückgängig machen, und Vercel
kann per Klick auf ein älteres Deployment zurückschalten
(Deployments → ⋯ → „Promote to Production").

## 4. Die häufigste Aufgabe: Gruppendaten aktualisieren

Die Website liest die Gruppen aus **einer Datei**, `static-site/data/groups.json`.
Diese Datei wird aber **aus der Datenbank der Admin-App erzeugt** — die Quelle der
Wahrheit ist die Admin-App.

**Einzelne Angabe korrigieren** (z. B. neue E-Mail einer Gruppe): in der
**Admin-App** ändern und danach die Daten live schalten — Schritt für Schritt in
`docs/runbooks/01-gruppe-aendern.md`. **Nicht** in `groups.json` auf GitHub ändern:
Der nächste Export überschreibt das wieder. Vor jedem Build prüft eine automatische
Datenprüfung die Datei (Antwortwerte, doppelte Gruppen, Filter, Kategorien, Links);
bei Fehlern bricht der Build ab und die **alte Seite bleibt online**.

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
stehen nur im Verzeichnis, als „unbestätigt" markiert (Schalter „Auch unbestätigte
Gruppen anzeigen", standardmäßig an).
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

**Nach größeren Änderungen** (neue Quiz-Fragen, Matching-Änderung, großes
Daten-Update): einen Eintrag mit Datum und Kurzbeschreibung in
`static-site/data/report-milestones.json` ergänzen (GitHub-Webeditor reicht).
Der Bericht zeigt dann bei den Top-Gruppen automatisch eine
„Seit der letzten Änderung"-Ansicht — zusätzlich zur festen
„Letzte 14 Tage"-Ansicht.

Für Fortgeschrittene gibt es den Bericht auch lokal: `npm run report` im
Ordner `static-site/` (Details in der README, Abschnitt „Report generator").

## 8. Wenn etwas nicht funktioniert

| Symptom | Wahrscheinliche Ursache | Lösung |
|---|---|---|
| Seite ganz weg | Domain abgelaufen ODER Vercel-Konto-Problem | Registrar/Vercel-Status prüfen |
| Änderung wird nicht sichtbar | Build fehlgeschlagen | Vercel → Deployments → Log ansehen; meist kaputtes JSON → Änderung auf GitHub reverten |
| Gruppe fehlt im Quiz | Gruppe ist noch unbestätigt (nach ihrer Einreichung nicht verifiziert) | Admin-App → verifizieren → Daten live schalten (Runbook 01) |
| Build rot „Datenprüfung FEHLGESCHLAGEN" | Fehler in den Gruppendaten (Meldung nennt Gruppe + Feld) | In der Admin-App korrigieren, neu exportieren |
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
| **Juli/August** | Bestätigungsrunde mit den Gruppen (`docs/runbooks/08-jaehrliche-bestaetigungsrunde.md`) |
| **2× jährlich** | Software-Updates der Admin-App und der Website (`docs/runbooks/12-updates.md`) |
| **Sonst** | Nichts. Alle Einzelaufgaben: `docs/runbooks/README.md`. |
