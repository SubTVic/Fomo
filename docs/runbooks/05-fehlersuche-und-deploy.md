<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: „Etwas ist kaputt" + Deployment verstehen

**Stand: Oktober 2026** (nach Umsetzungsplan Phase 1–5).

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
  (siehe „Migration in Produktion einspielen" unten).

## Migration in Produktion einspielen

Nötig, wenn ein gemergter PR einen neuen Ordner unter `prisma/migrations/` mitbringt.
**Reihenfolge:** erst mergen und deployen lassen, dann **sofort** migrieren. Bis dahin
wirft die Admin-App Fehler wie „The table `public.…` does not exist" (die Website ist
nicht betroffen). Migrieren *vor* dem Deploy kann dagegen die noch laufende alte
Version brechen.

1. **Backup:** Admin-Dashboard → „Backup herunterladen" (nur SUPER_ADMIN) oder bei Neon
   einen Wiederherstellungspunkt/Branch anlegen. Backup nie ins Repo legen.
2. **Zugangsdaten holen:** Vercel → Projekt `fomo` → Settings → Environment Variables →
   `DIRECT_URL` (Adresse ohne `-pooler`) und `DATABASE_URL` (Production). Nur lokal
   verwenden, nirgends speichern oder weitergeben.
3. **Auf dem eigenen Rechner im Repo** (aktueller `main`):
   ```bash
   git checkout main && git pull && npm ci
   export DIRECT_URL='…'          # die ganze Adresse aus Vercel, in EINER Zeile, ohne < >
   export DATABASE_URL='…'
   npx prisma migrate status      # listet die offenen Migrationen
   npx prisma migrate deploy      # = npm run db:migrate
   npx prisma migrate status      # → „Database schema is up to date!"
   ```
   **Nie `prisma migrate dev` oder `migrate reset` gegen die echte Datenbank**, auch
   wenn Prisma es in seiner Ausgabe vorschlägt – das ist nur für lokale Test-Datenbanken.
4. Admin-App neu laden (kein Redeploy nötig) und kurz durchklicken: Login, „Änderungen",
   eine Gruppe per Bearbeitungslink ändern.

**Typische Fehler:** `P1013 … scheme is not recognized` → Adresse falsch eingefügt
(spitze Klammern, Zeilenumbruch). Schlägt eine Migration fehl: nicht blind wiederholen,
Meldung sichern, `npx prisma migrate status` ansehen.
**Notbremse:** Vercel → `fomo` → Deployments → letzter Stand vor dem Merge →
„Instant Rollback". Solange noch nicht migriert wurde, läuft die alte Version sofort wieder.

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
| Logo fehlt | Slug/Dateiname in `logos.json` falsch | Schreibweise + `%20` prüfen |
| Statistik/Report leer oder alt | `UMAMI_*`-Env fehlt in Vercel; Deploy-Hook-Secret fehlt | Env prüfen; Secret `VERCEL_DEPLOY_HOOK_URL` setzen (Runbook 09) |
| Admin-Login klappt nicht / plötzlich abgemeldet | Konto deaktiviert, oder `AUTH_SECRET` wurde rotiert | Runbook 10 |
| Admin-App: Fehler nach Deploy mit neuer Migration | Migration noch nicht eingespielt | `npm run db:status` (berechtigte Person), dann `db:migrate` nach Backup |

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
