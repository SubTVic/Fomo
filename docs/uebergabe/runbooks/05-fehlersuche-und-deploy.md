<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: „Etwas ist kaputt" + Deployment verstehen

## So deployt FOMO

- **Öffentliche Seite:** Jeder Merge nach `main`, der `static-site/` berührt, baut das
  Vercel-Projekt `fomo-static` neu → ~2 Min später live. Rückgängig: Vercel →
  Deployments → älteren Eintrag → „Promote to Production", oder den Commit auf GitHub
  reverten.
- **Interne App (Registrierung/Admin):** eigenes Vercel-Projekt `fomo`. ⚠️ **Dessen
  Build ist seit 30.06.2026 kaputt** (siehe unten) — bis zum Fix lässt sich dort nichts
  neu deployen.

## Schnelldiagnose nach Symptom

| Symptom | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Seite ganz weg | Domain abgelaufen ODER Vercel-Problem | Registrar + Vercel-Status prüfen |
| Website-Änderung nicht sichtbar | Build fehlgeschlagen oder nicht gemerged | Vercel → Deployments → Log; meist kaputtes JSON → Commit reverten |
| Gruppe fehlt im Quiz | Gruppe unbestätigt oder nach Re-Submit nicht neu verifiziert | Admin → verifizieren → Export (Runbook 01) |
| Daten veraltet, obwohl Gruppen etwas geändert haben | Daten-Sync (Backup→Export→Commit) wurde nicht gemacht | Runbook 01, „Daten live schalten" |
| Logo fehlt | Slug/Dateiname in `logos.json` falsch | Schreibweise + `%20` prüfen |
| Statistik/Report leer oder alt | `UMAMI_*`-Env fehlt in Vercel; Deploy-Hook-Secret fehlt | Env prüfen; Secret `VERCEL_DEPLOY_HOOK_URL` setzen |
| Admin-App lädt nicht / Änderung geht nicht live | Root-App-Build kaputt (s. u.) | Build-Fehler fixen |

## Der bekannte Root-App-Build-Fehler (Priorität)

`next build` der internen App bricht ab mit:
`scripts/export-static-site-groups.ts:117 — Type error (TS2322)`.
Ursache: `tsconfig.json` zieht `scripts/**` in den Typecheck ein, und `filterSelections`
aus dem Prisma-JSON-Feld wird einem `string[]` zugewiesen.

Fix-Optionen (mit technischer Begleitung, auf einem Branch):
1. In `scripts/export-static-site-groups.ts:117` den Typ absichern, z. B.
   `filterSelections: Array.isArray(realRating.filterSelections) ? realRating.filterSelections as string[] : []`.
2. Oder `scripts/` aus dem Build-Typecheck ausschließen (`tsconfig.json` → `exclude`).
Danach lokal `npm run build` grün prüfen, dann PR/Merge.

## Wie man selbst nachsieht, was kaputt ist

- **Vercel-Dashboard → Deployments:** roter Eintrag → „Build Logs" zeigt die Fehlerzeile.
- **Lokal reproduzieren:** `cd static-site && npm install && npm run build` (öffentliche
  Seite) bzw. im Root `npm install && npm run build` (interne App, braucht DB-Zugang).
- **Daten prüfen:** `cd static-site && node scripts/validate-data.mjs`.

## Fehlt heute (Audit-Empfehlung)

- **Kein Monitoring/Alerting** → deshalb fiel der Root-Build-Fehler monatelang niemandem
  auf. Uptime-Monitor (z. B. UptimeRobot) + Fehler-Logging (z. B. Sentry) einrichten.
- **Keine CI auf Pull Requests** → Branch-Protection + CI (`build`, `lint`, `test`,
  `validate-data`) als Pflicht-Checks einrichten, damit kaputte Änderungen `main` gar
  nicht erst erreichen.
