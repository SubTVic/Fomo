<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# AGENTS.md

Anweisungen für KI-Coding-Agenten stehen in **[`CLAUDE.md`](CLAUDE.md)** — bitte
zuerst vollständig lesen. Kurzfassung der wichtigsten Regeln:

- Zwei Apps: `static-site/` (öffentliche Seite) und Root-App (`src/`, `prisma/`, intern).
- Nie direkt auf `main` pushen; immer Branch + Pull Request mit grüner CI.
- `static-site/data/groups.json` nie von Hand ändern (wird aus der DB erzeugt).
- Keine `.env`-Dateien, Backups oder Secrets lesen/committen; keine Verbindung zu
  Produktivsystemen; Migrationen nur lokal.
- Quiz-Matching nur mit verifizierten Gruppen (`getMatchableGroups`).
- Aufgaben-Anleitungen: [`docs/runbooks/`](docs/runbooks/README.md); offene Aufgaben: `TODO.md`.
