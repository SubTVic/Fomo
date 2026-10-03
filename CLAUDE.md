# FOMO – Projektkontext für Claude Code

**Stand: Oktober 2026.** Diese Datei beschreibt den **tatsächlichen** Stand. Offene
Aufgaben: **`TODO.md`**. Laufender Umbau (Arbeitspakete, Regeln, Fortschritt):
**`docs/uebergabe/umsetzungsplan.md`** — vor jedem Arbeitspaket dessen §1 lesen.

## Vision

FOMO hilft Erstis der TU Dresden, passende Hochschulgruppen zu finden: 21 Fragen
beantworten, Matching im Browser, Top-Empfehlungen mit Kontaktinfos. Finanziert vom
StuRa TU Dresden, live seit Juli 2026 auf **www.fomo-dresden.app**. Haupt-Traffic:
Erstiwoche (September). Langfristig auf andere Hochschulen übertragbar.

**Zielgruppe:** 18–25, ~80 % mobil. Die App soll sich wie ein Consumer-Produkt
anfühlen, nicht wie ein Behördenformular. Mobile-first, alles muss bei 375 px
funktionieren. Spaß und Wissenschaftlichkeit sind kein Widerspruch.

## ⚠️ Das Wichtigste zuerst: Es gibt ZWEI Apps in diesem Repo

| | **Statische Seite** `static-site/` | **Root-App** `src/`, `prisma/` |
|---|---|---|
| Zweck | **die öffentliche Seite** (Quiz, Verzeichnis, Report) | **internes** Tool: Registrierung, Bearbeitungslinks, Admin |
| Live auf | **www.fomo-dresden.app** (Vercel-Projekt `fomo-static`) | fomo-pi.vercel.app (Vercel-Projekt `fomo`) |
| Technik | Next.js **Static Export** (`output: "export"`), kein Server, keine DB | Next.js + Prisma + **PostgreSQL** + Auth.js v5 |
| Daten | `static-site/data/*.json` (zur Build-Zeit eingebacken) | PostgreSQL — **die Quelle der Wahrheit für Gruppen** |
| Matching | **client-side**, `static-site/src/lib/matching.ts` | keins mehr (altes Quiz/Pilot/Demo leiten auf die Live-Seite um; Code-Entfernung: Plan Phase 5) |

**Bei Arbeiten an der öffentlichen Seite: nur `static-site/` anfassen.**

## Die Datenpipeline (so kommen Gruppendaten live)

```
Admin-App (Gruppe bearbeitet per Link / Admin pflegt)
  → Admin: „Backup herunterladen" (JSON, enthält PII — nie ins Repo!)
  → cd static-site && node scripts/export-from-backup.mjs --backup <datei>
  → node scripts/validate-data.mjs
  → groups.json auf einem Branch committen → PR → CI grün → Merge → ~2 Min live
```
Schritt-für-Schritt: `docs/runbooks/01-gruppe-aendern.md`. Automatisierung: Plan WP-4.5.

### Do's & Don'ts der Datenpflege

- **NIE `static-site/data/groups.json` von Hand editieren** (ein Hook blockiert das).
  Der nächste Export überschreibt es. Korrekturen gehören in die **DB** (Admin-App).
- **NIE `npm run import:groups` oder „CSV neu importieren"/„Scraper-JSON"** im Admin
  benutzen — überschreibt Verifizierung, Slugs, Texte und reaktiviert Duplikate.
- **Eine Gruppen-Einreichung setzt `isVerified=false`.** Nur verifizierte Gruppen mit
  echtem Self-Rating kommen ins Quiz (`getMatchableGroups`). Nach jeder Korrektur muss
  ein Admin neu verifizieren (bis Plan WP-4.1).
- **Logos und EN-Übersetzungen leben außerhalb der DB:** `static-site/public/group-logos/`
  + `static-site/data/logos.json` (nach Slug), EN-Texte in
  `static-site/src/lib/group-translations.ts`.
- **Backup-Dateien NIE committen oder lesen** — Kontakt-PII und gültige Tokens.
- `validate-data.mjs` läuft **automatisch vor jedem Build** (`prebuild`) und in der CI:
  kaputte Ratings, doppelte Slugs, unbekannte Filter/Kategorien, kaputte Links
  verifizierter Gruppen brechen den Build ab.

## Quiz, Items, Matching

- **21 WS2-Items + 8 Aktivitäts-Filter.** Die 17 Binär-Attribute sind Altbestand; sie
  dienen nur noch dazu, Profile **unbestätigter** Gruppen abzuleiten.
- **Items liegen doppelt:** `data/working-set-v2.json` (Registrierung) und
  `static-site/data/quiz.json` (Website). Beide synchron halten (Check: Plan WP-4.7).
- Gruppen und Studis beantworten **dieselben** Items. Item-IDs folgen `WS2-\d{2}`.
- **Matching:** mittlere absolute Distanz über die **nicht-neutralen** Antworten
  (`score = round((1 − Σ|user − group| / (n · 2)) · 100)`), Filter als **harte**
  Bedingung, ohne aktive Antworten 50. Sortierung nach ungerundetem Fit, dann
  expliziter Filtertreffer, dann Hash (fair, aber deterministisch pro Antworten).
  Angezeigt: Top 5 + Gleichstände, max. 10. Es gibt **keine** Gewichtsformel und
  **keine** „≥ 5 Antworten"-Schwelle (beides Altbestand aus v1).
- `static-site/scripts/report.mjs` hat eine Kopie des Matchings; ein Paritätstest
  (`static-site/src/lib/__tests__/report-parity.test.ts`) hält sie synchron.
- **Item-Reihenfolge, IDs und Filternamen NICHT ändern** ohne Migration: `?r=`-Links
  und der Report kodieren positionsbasiert (`docs/runbooks/07-quiz-item-aendern.md`).
- **Nur verifizierte Gruppen** im Quiz (`getMatchableGroups`, **nie** `getGroups`).
- Verzeichnis `/groups`: Toggle „unbestätigte anzeigen" steht **standardmäßig an**.
- Datenstand im Repo (Export 17.08.2026): 95 Gruppen, 51 verifiziert, 44 unbestätigt.

## Leitplanken (technisch erzwungen)

`.claude/settings.json` (gilt für jede Claude-Code-Sitzung in diesem Repo):

- **Gesperrt per `permissions.deny`:** `.env*` lesen/schreiben (außer
  `.env.example`), Backup-/Dump-Dateien lesen, `prisma migrate deploy|reset`,
  `prisma db push`, `npm run db:migrate`, `npm run import:groups`,
  Force-Push, Push auf `main`.
- **Hooks** (`.claude/hooks/`, Logik in `guards.mjs`): blockieren
  Handänderungen an `static-site/data/groups.json` (wird aus der DB erzeugt →
  Admin-App, `docs/runbooks/01-gruppe-aendern.md`), DB-URLs auf nicht-lokale
  Hosts und `git push` auf `main`/ohne Branch auf `main`.
- Selbsttest: `sh .claude/hooks/test-guards.sh` (im Terminal ausführen).
- Persönliche Ausnahmen gehören in `.claude/settings.local.json` (nicht im Repo).

Außerdem gilt (siehe Plan §1): keine Verbindung zu Produktivsystemen, Migrationen nur
lokal erzeugen/testen (ausführen tut ein Mensch nach Backup: `npm run db:migrate`),
keine History-Umschreibung, keine Sicherheitsdetails in Commits/PRs/Doku (Repo ist
öffentlich).

## Prüfbefehle

```bash
# Statische Seite
cd static-site && npm ci && node scripts/validate-data.mjs && npx tsc --noEmit && npm test && npm run build
# Root-App (ohne echte DB)
npm ci && npx tsc --noEmit && npx eslint src scripts prisma tests && npm test
DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_URL="$DATABASE_URL" AUTH_SECRET=dummy npx next build
# E2E gegen lokale DB: docker compose up -d db && npx prisma migrate dev && npx prisma db seed && npm run test:e2e
```
Dieselben Schritte laufen in der CI (`.github/workflows/ci.yml`, Jobs `static-site`
und `root`) auf jedem PR. Node-Version: `.nvmrc` (24).

## Tech-Stack

- **Statische Seite:** Next.js 15 (App Router, TS), Static Export, Tailwind 4,
  DE + EN (`/en/`), Umami (anonym), Vitest. Deploy: Vercel.
- **Root-App:** Next.js 15, Prisma 6, PostgreSQL 16, Auth.js v5 (Credentials),
  next-intl, Zod, Vitest + Playwright. Admin-Zugriff nur über
  `requireAdminApi()`/`requireAdminPage()` (`src/lib/require-admin.ts`, prüft
  Aktiv-Status und Rolle in der DB). Der Build migriert die DB **nicht**.
- **Lizenz:** AGPL-3.0. Next.js 15 hat am **21.10.2026** Support-Ende (Plan Phase 3).

## Konventionen

- Server Components by default, `"use client"` nur wenn nötig. API-Routen mit Zod.
- **Deutsche UI-Texte**, englische Code-Kommentare/Variablen, englische
  konventionelle Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **Kein localStorage/sessionStorage** (SecurityError-Risiko) — State nur über
  React-State oder URL-Parameter.
- **SPDX-Header** in jeder Quellcode-Datei: `// SPDX-License-Identifier: AGPL-3.0-only`
  (Markdown: `<!-- SPDX-License-Identifier: AGPL-3.0-only -->`).
- **Nie direkt auf `main` pushen** — `main` deployt live. Immer Branch + PR + grüne
  CI + Preview ansehen.

## Design

Brutalist-Poster-Stil: dicke Borders (4px solid #1a2a35), Uppercase-Headlines,
klares Grid. Fonts: **Archivo Black** (Headlines), **Lexend** 300–700 (Text).
Farben: Hintergrund #ADD8E6, Primär/Text dunkel #1a2a35, Karten #fff, Button
#1a2a35 auf #ADD8E6-Text (Hover #2a3a45), Text body #5a7a8a, muted #7a9aaa/#8aaaba,
Akzent #5a8a9a. Fallback-Farben der Kategorien: `static-site/data/categories.json`.

## Fallstricke mit irreführenden Namen

- `src/lib/study2/items.ts` ist **nicht** das verworfene „Studie 2", sondern das
  **Kern-Item-Set der Registrierung** (Umbenennung: Plan WP-4.7).
- Route `/pilot` = Studie 2 (verworfen, leitet um); `/api/pilot/*` = Pilot 1 (abgeschlossen).
- Filter-Attribut `party` = **„Hochschulpolitik & Mitbestimmung"**, nicht „Feiern".
- `scripts/export-static-data.ts` ist veraltet — die richtigen Exporter sind
  `static-site/scripts/export-from-backup.mjs` bzw. `scripts/export-static-site-groups.ts`.
- `APP_MODE` gibt es nicht (nur `APP_LIVE` für die Landingpage der Root-App).

## Wo was steht

- **Runbooks je Aufgabe:** [`docs/runbooks/`](docs/runbooks/README.md) (Index der 12
  typischen Wartungsaufgaben).
- Betrieb ohne Programmierkenntnisse: `static-site/docs/BETRIEBSHANDBUCH.md`.
- Mit KI an der statischen Seite arbeiten: `static-site/docs/KI-MITARBEIT.md`.
- Übergabe-Audit mit allen Befunden: `docs/uebergabe/audit.md`; Umbauplan:
  `docs/uebergabe/umsetzungsplan.md`; Hintergrund: `docs/uebergabe/recherche-umsetzung.md`.
- Abgeschlossene alte Pläne: `CLAUDE-pläne/archiv/`.
- Gamification-Ideen (Reveal, Profil, Badges, Share-Cards): Backlog in `TODO.md`.
