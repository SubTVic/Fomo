# FOMO – Projektkontext für Claude Code

**Stand: Oktober 2026** (Umbau Phase 1–5 + Oktober-Audit seit 04.10. in `main`;
Prod-Migrationen und Go-live-Schritte: `TODO.md` §1.0). Diese Datei beschreibt den
**tatsächlichen** Stand. Offene
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
| Matching | **client-side**, `static-site/src/lib/matching.ts` | keins (alte URLs `/quiz`, `/pilot`, `/demo`, `/groups` leiten per `next.config.ts` auf die Live-Seite um) |

**Bei Arbeiten an der öffentlichen Seite: nur `static-site/` anfassen.**

## Die Datenpipeline (so kommen Gruppendaten live)

```
Admin-App (Gruppe bearbeitet per Link / Admin pflegt)
  → GitHub Actions „Daten-Sync" (.github/workflows/sync-groups.yml, per Hand gestartet)
      holt /api/admin/export/static-groups (Bearer EXPORT_TOKEN, nur öffentliches Format)
      → validate-data.mjs → PR „Daten-Sync <Datum>" mit Änderungsliste
  → CI grün → Merge → ~2 Min live
```
Export-Logik: `src/lib/export/static-groups.ts` (gleiches Format wie der Notfallweg
`static-site/scripts/export-from-backup.mjs`, ein Test hält beide gleich).
Schritt-für-Schritt: `docs/runbooks/01-gruppe-aendern.md`.

### Do's & Don'ts der Datenpflege

- **NIE `static-site/data/groups.json` von Hand editieren** (ein Hook blockiert das).
  Der nächste Export überschreibt es. Korrekturen gehören in die **DB** (Admin-App).
- **Keinen Massen-Import aus CSV/Scraper-JSON** wiederbeleben — er überschrieb Verifizierung,
  Slugs, Texte und reaktivierte Duplikate. (Admin-Knöpfe seit WP-4.4, `npm run import:groups`
  seit WP-5.2 entfernt; die Sperre in `.claude/settings.json` bleibt.)
- **Nur verifizierte Gruppen mit echtem Self-Rating kommen ins Quiz**
  (`getMatchableGroups`). Korrekturen einer **verifizierten** Gruppe lassen die
  Verifizierung stehen (E1); jede Änderung landet im Protokoll `GroupChangeLog`
  (`src/lib/change-log.ts`, Admin-Seite „Änderungen" mit „Rückgängig"). Einreichungen
  **unbestätigter** Gruppen brauchen weiter eine Admin-Verifizierung.
- **Logos und EN-Übersetzungen leben außerhalb der DB:** `static-site/public/group-logos/`
  + `static-site/data/logos.json` (nach Slug), EN-Texte in
  `static-site/data/group-translations.json` (mit `sourceHash`; `validate-data.mjs`
  warnt, wenn sich der deutsche Text seitdem geändert hat). Ohne EN-Text zeigt `/en`
  ehrlich den deutschen Text mit Hinweis — kein Wort-für-Wort-„Übersetzer".
- **Kategorien:** eine Liste in `static-site/data/categories.json` (Name DE/EN, Farbe,
  SEO-Seite). Neue Kategorie in der DB → dort ergänzen, sonst bricht die Datenprüfung.
- **Backup-Dateien NIE committen oder lesen** — Kontakt-PII und gültige Tokens.
- `validate-data.mjs` läuft **automatisch vor jedem Build** (`prebuild`) und in der CI:
  kaputte Ratings, doppelte Slugs, unbekannte Filter/Kategorien, kaputte Links
  verifizierter Gruppen brechen den Build ab.

## Quiz, Items, Matching

- **21 WS2-Items + 8 Aktivitäts-Filter.** Die 17 Binär-Attribute sind Altbestand; sie
  dienen nur noch dazu, Profile **unbestätigter** Gruppen abzuleiten.
- **Items liegen doppelt:** `data/working-set-v2.json` (Registrierung, Modul
  `src/lib/ws2-items.ts`) und `static-site/data/quiz.json` (Website). Beide gemeinsam
  ändern — `scripts/check-items-sync.mjs` prüft das in der CI.
- Gruppen und Studis beantworten **dieselben** Items. Item-IDs folgen `WS2-\d{2}`.
- **Matching:** mittlere absolute Distanz über die **nicht-neutralen** Antworten
  (`score = round((1 − Σ|user − group| / (n · 2)) · 100)`), Filter als **harte**
  Bedingung, ohne aktive Antworten 50. Sortierung nach ungerundetem Fit, dann
  expliziter Filtertreffer, dann Hash (fair, aber deterministisch pro Antworten).
  Angezeigt: Top 5 + Gleichstände, max. 10. **Mindestregel:** unter 5 nicht-neutralen
  Antworten (`MIN_ACTIVE_ANSWERS`) zeigt die Ergebnisseite einen Hinweis statt eines
  Rankings (Event `results-too-few-answers`). Es gibt **keine** Gewichtsformel
  (Altbestand aus v1).
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
cd static-site && npm ci && node scripts/validate-data.mjs && npx tsc --noEmit && npm run lint && npm test && npm run build
# Root-App (ohne echte DB)
npm ci && node scripts/check-items-sync.mjs && npx tsc --noEmit && npx eslint src scripts prisma tests && npm test
DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_URL="$DATABASE_URL" AUTH_SECRET=dummy npx next build
# E2E gegen lokale DB: docker compose up -d db && npx prisma migrate dev && npx prisma db seed && npm run test:e2e
```
Dieselben Schritte laufen in der CI (`.github/workflows/ci.yml`, Jobs `static-site`
und `root`) auf jedem PR. Node-Version: **24** (`.nvmrc`, `engines` in beiden `package.json`).

## Tech-Stack

- **Statische Seite:** Next.js 16 (App Router, TS, Turbopack), Static Export, Tailwind 4,
  DE + EN (`/en/`), Umami (anonym), Vitest. Deploy: Vercel.
- **Root-App:** Next.js 16, Prisma 6, PostgreSQL 16, Auth.js v5 (Credentials),
  next-intl, Zod, Vitest + Playwright. Admin-Zugriff nur über
  `requireAdminApi()`/`requireAdminPage()` (`src/lib/require-admin.ts`, prüft
  Aktiv-Status und Rolle in der DB). Backup, Löschen, Zusammenführen und
  Admin-Verwaltung nur mit `{ role: "SUPER_ADMIN" }`. Login: E-Mail klein geschrieben,
  Sperre nach Fehlversuchen (`src/lib/login-guard.ts`). Der Build migriert die DB **nicht**.
- **Lizenz:** AGPL-3.0.
- **Sprach-Routing der Root-App:** `src/proxy.ts` (next-intl; hieß bis Next 15
  `middleware.ts`). Interne Links in `src/app/[locale]/` immer mit `Link` aus
  `@/i18n/navigation`, **nicht** `next/link` — sonst leitet der Proxy jeden Prefetch um
  (unter Next 16 eine Endlosschleife).

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

- Filter-Attribut `party` = **„Hochschulpolitik & Mitbestimmung"**, nicht „Feiern".
- `scripts/export-static-data.ts` ist veraltet — die richtigen Exporter sind
  `src/lib/export/static-groups.ts` (Daten-Sync, `scripts/export-static-site-groups.ts`)
  und der Notfallweg `static-site/scripts/export-from-backup.mjs`.
- `APP_MODE` und `APP_LIVE` gibt es nicht (mehr). Pilot, Studie 2, Demo und das alte Quiz
  wurden in WP-5.2 entfernt, ihre Tabellen in WP-5.3 (Migration `drop_legacy_tables`).

## Wo was steht

- **Runbooks je Aufgabe:** [`docs/runbooks/`](docs/runbooks/README.md) (Index der 13
  typischen Wartungsaufgaben; Backup/Migration/Wiederherstellung: Runbook 11).
- Setup, alle Env-Variablen und GitHub-Secrets, Deployment beider Vercel-Projekte:
  `README.md` (Root).
- Betrieb ohne Programmierkenntnisse: `static-site/docs/BETRIEBSHANDBUCH.md`.
- Löschfristen und Betroffenenanfragen: `docs/datenschutz-loeschkonzept.md`
  (automatische Löschung: `scripts/cleanup.ts`).
- Mit KI an der statischen Seite arbeiten: `static-site/docs/KI-MITARBEIT.md`.
- Übergabe-Audit mit allen Befunden: `docs/uebergabe/audit.md`; Umbauplan:
  `docs/uebergabe/umsetzungsplan.md`; Hintergrund: `docs/uebergabe/recherche-umsetzung.md`.
- Abgeschlossene alte Pläne: `CLAUDE-pläne/archiv/`.
- Gamification-Ideen (Reveal, Profil, Badges, Share-Cards): Backlog in `TODO.md`.
