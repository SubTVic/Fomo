<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: „Etwas ist kaputt" + Deployment verstehen

**Stand: Oktober 2026** (nach Umsetzungsplan Phase 1–5 und dem Oktober-Audit).

## So deployt FOMO

- **Jede Änderung läuft über einen Pull Request.** Die CI (GitHub Actions,
  `.github/workflows/ci.yml`) baut und testet beide Apps; erst bei grünem Haken mergen.
- **Öffentliche Seite:** Jeder Merge nach `main`, der `static-site/` berührt, baut das
  Vercel-Projekt `fomo-static` neu → ~2 Min später live. Vor dem Build läuft
  automatisch die Datenprüfung (`validate-data.mjs`); kaputte Daten stoppen den Build,
  die alte Seite bleibt online. Rückgängig: Vercel → Deployments → älteren Eintrag →
  „Promote to Production", oder den Commit auf GitHub reverten.
- **Interne App (Registrierung/Admin):** eigenes Vercel-Projekt `fomo`
  (fomo-pi.vercel.app). Der Build verändert die **Datenbank nicht**. Neue
  Datenbank-Migrationen spielt ein Mensch bewusst nach einem Backup ein
  (`npm run db:status`, dann `npm run db:migrate`; Schritt für Schritt:
  [Runbook 11](11-backup-und-migration.md)).
- **Vercel-Limit:** Der Gratis-Tarif begrenzt die Zahl der Builds pro Tag. Ist es
  erreicht, stehen im PR rote Vercel-Einträge „Deployment rate limited — retry in 24
  hours“. Das ist **kein Fehler im Code** (die GitHub-Checks `static-site` und `root`
  zählen). Nach Ablauf baut Vercel neue Commits wieder; einen verpassten
  Production-Deploy startet man von Hand (Deployments → ⋯ → „Redeploy“).

## Schnelldiagnose nach Symptom

| Symptom | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Seite ganz weg | Domain abgelaufen ODER Vercel-Problem | Registrar + Vercel-Status prüfen |
| Website-Änderung nicht sichtbar | PR nicht gemergt, oder Build fehlgeschlagen | PR-Status/CI ansehen; Vercel → Deployments → Log |
| Build rot: „Datenprüfung FEHLGESCHLAGEN" | Fehler in `groups.json`/`quiz.json` (Meldung nennt Gruppe + Feld) | In der Admin-App korrigieren, neu exportieren (Runbook 01) |
| CI rot im PR | Typfehler, Test oder Build bricht | Log des roten Jobs (`static-site` oder `root`) öffnen; Fehlerzeile beheben |
| Gruppe fehlt im Quiz | Gruppe noch unbestätigt (nach Einreichung nicht verifiziert) | Admin → verifizieren → Export (Runbook 01) |
| Daten veraltet, obwohl Gruppen etwas geändert haben | Daten-Sync nicht gestartet oder PR nicht gemergt | Runbook 01, „Daten live schalten" |
| Daten-Sync rot | `EXPORT_TOKEN` fehlt/passt nicht, oder Datenprüfung schlägt an, oder > 20 % Gruppen würden wegfallen | Log des Workflows lesen; Runbook 01 |
| Datenprüfung: „… ist kein gültiger Link (muss mit https:// beginnen)“ | Website/Instagram einer **verifizierten** Gruppe ist kein vollständiger Link (seit Okt. 2026 ein Fehler, keine Warnung mehr) | In der Admin-App korrigieren (vollständige Adresse mit `https://`), Daten-Sync neu starten |
| Ergebnisseite zeigt „zu wenige Antworten“ statt Gruppen | **Gewollt:** unter 5 nicht-neutralen Antworten gibt es kein Ranking (Mindestregel) | Nichts — die Person beantwortet mehr Fragen mit Ja/Nein |
| Vercel-Status im PR rot: „Deployment rate limited“ | Tageslimit des Gratis-Tarifs | Siehe oben „Vercel-Limit“; GitHub-Checks entscheiden |
| Logo fehlt | Slug/Dateiname in `logos.json` falsch | Schreibweise + `%20` prüfen |
| Statistik/Report leer oder alt | `UMAMI_*`-Env fehlt in Vercel; Deploy-Hook-Secret fehlt | Env prüfen; Secret `VERCEL_DEPLOY_HOOK_URL` setzen (Runbook 09) |
| Admin-Login klappt nicht / plötzlich abgemeldet | Konto deaktiviert, oder `AUTH_SECRET` wurde rotiert | Runbook 10 |
| Admin-App: Login oder Gruppenbearbeitung kaputt nach Deploy | Neue Migration noch nicht eingespielt | [Runbook 11](11-backup-und-migration.md), Abschnitt B |

## Wie man selbst nachsieht, was kaputt ist

- **GitHub → Pull Request → Checks:** roter Job → „Details" zeigt die Fehlerzeile.
- **Vercel-Dashboard → Deployments:** roter Eintrag → „Build Logs".
- **Lokal reproduzieren** (braucht Node.js 24, siehe `.nvmrc`):
  - öffentliche Seite: `cd static-site && npm ci && npm run build`
  - interne App ohne echte DB:
    `npm ci && DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_URL="$DATABASE_URL" AUTH_SECRET=dummy npx next build`
- **Daten prüfen:** `cd static-site && node scripts/validate-data.mjs`.
- **Tests:** `npm test` (Root) bzw. `cd static-site && npm test`.

## Fehlt heute noch

- **Monitoring/Alerting** (Uptime-Check, Fehler-Logging) → Umsetzungsplan WP-6.8.
  Bis dahin: nach jedem Merge kurz die Live-Seite und `/admin` aufrufen.
