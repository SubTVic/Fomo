<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Contributing to FOMO

## Branch-Strategie

```
main ─────────────────── Pilot-Code (läuft live, nicht anfassen)
  │
  └── develop/production ── Endprodukt-Entwicklung
        │
        ├── feat/...       Feature-Branches (kurzlebig)
        └── fix/...        Bug-Fix-Branches
```

### Regeln

- **`main`** ist tabu solange die Pilotstudie läuft. Kein Merge nach `main` ohne Team-Absprache.
- **`develop/production`** ist der Entwicklungs-Branch für das Endprodukt. Alle Features branchen davon ab und werden per PR zurückgemergt.
- **Feature-Branches** benennen: `feat/<kurzbeschreibung>` (z.B. `feat/dockerfile`, `feat/semester-management`)
- **Fix-Branches** benennen: `fix/<kurzbeschreibung>` (z.B. `fix/csp-header`)

### Nach der Pilotstudie

Wenn die Pilot-Ergebnisse da sind:

1. Pilot-Daten exportieren (CSV + SQL-Dump)
2. Git-Tag `pilot-complete` auf `main` setzen
3. `develop/production` → `main` mergen
4. Pilot-Code entfernen (Tabellen, Varianten, APP_MODE)
5. Finale Thesen + Gewinner-Variante einpflegen

## Entwicklungsumgebung

```bash
# Repo klonen & Branch wechseln
git clone git@github.com:SubTVic/Fomo.git
cd Fomo/Github/fomo
git checkout develop/production

# Abhängigkeiten & Datenbank
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev
npx prisma db seed

# Entwicklungsserver
npm run dev   # → http://localhost:3000
```

## Commits

Konventionelle Commit-Messages auf Englisch:

```
feat: add semester management API
fix: handle expired tokens in registration
docs: update runbook with backup instructions
refactor: simplify quiz session tracking
test: add matching algorithm unit tests
```

## Code-Konventionen

- TypeScript, Server Components by default
- Deutsche UI-Texte, englische Code-Kommentare
- Zod-Validierung auf allen API-Inputs
- SPDX-Header in jeder Datei: `// SPDX-License-Identifier: AGPL-3.0-only`
- Mobile-first (80% der Nutzer auf dem Handy)
