# FOMO – Find Our Matching Organizations

> Finde die Hochschulgruppe, die zu dir passt.

FOMO ist eine Open-Source-Webanwendung, die Erstsemester der TU Dresden über ein Quiz-basiertes Matching mit passenden Hochschulgruppen verbindet. Beantworte ~20 Fragen und erhalte personalisierte Empfehlungen – ähnlich wie beim Wahl-O-Mat, aber für studentisches Engagement.

## Features

- **Quiz:** ~20 Fragen zu Interessen, Werten und Zeitbudget
- **Matching:** Algorithmus berechnet Übereinstimmung mit 100+ Hochschulgruppen
- **Ergebnisse:** Top-Empfehlungen mit Kontaktinfos, Logos und Links
- **Übersicht:** Alle Hochschulgruppen durchstöbern und filtern
- **Admin:** Gruppen und Fragen verwalten (mit Login)
- **Datenschutz:** Matching läuft komplett im Browser – keine Nutzerdaten werden gespeichert

## Tech-Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [PostgreSQL 16](https://www.postgresql.org/)
- [Prisma](https://www.prisma.io/)
- [Auth.js](https://authjs.dev/)
- [Docker Compose](https://docs.docker.com/compose/)

## Lokale Entwicklung

### Voraussetzungen

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) (für PostgreSQL)
- [Git](https://git-scm.com/)

### Setup

```bash
# Repository klonen
git clone https://github.com/EUER-USERNAME/fomo.git
cd fomo

# Umgebungsvariablen einrichten
cp .env.example .env

# Datenbank starten
docker compose up -d db

# Dependencies installieren
npm install

# Datenbank-Schema anwenden
npx prisma migrate dev

# Seed-Daten laden
npx prisma db seed

# Entwicklungsserver starten
npm run dev
```

Die App läuft dann unter [http://localhost:3000](http://localhost:3000).

### Nützliche Befehle

```bash
npm run dev          # Entwicklungsserver
npm run build        # Production Build
npm run lint         # Linting
npm run test         # Tests
npx prisma studio    # Datenbank-GUI
npx prisma migrate dev  # Neue Migration erstellen
```

## Projektstruktur

```
src/
├── app/              # Next.js App Router (Seiten + API)
├── components/       # React-Komponenten
├── lib/              # Hilfsfunktionen, Algorithmus, DB-Client
└── types/            # TypeScript-Typen
prisma/
├── schema.prisma     # Datenmodell
├── seed.ts           # Beispieldaten
└── migrations/       # DB-Migrationen
```

## Deployment auf Vercel

### 1. Projekt verbinden

- Vercel-Account erstellen und GitHub-Repository verbinden
- Vercel erkennt Next.js automatisch – keine spezielle Konfiguration nötig

### 2. Postgres-Datenbank erstellen

- Im Vercel-Dashboard unter **Storage** → **Create Database** → **Postgres**
- Die `DATABASE_URL` wird automatisch als Environment Variable gesetzt

### 3. Environment Variables setzen

Unter **Settings** → **Environment Variables** folgende Werte setzen:

| Variable | Beschreibung |
| --- | --- |
| `DATABASE_URL` | Wird automatisch von Vercel Postgres gesetzt |
| `NEXTAUTH_SECRET` | Zufälliger String (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Deine Vercel-Domain (z.B. `https://fomo.vercel.app`) |
| `APP_MODE` | `pilot`, `collect` oder `live` |
| `PILOT_EXPORT_KEY` | Zufälliger String für den Daten-Export |

### 4. Deployen

- Push auf `main` löst automatisch einen Deploy aus
- Der `postinstall`-Hook generiert den Prisma Client beim Build

### 5. Datenbank initialisieren

Nach dem ersten Deploy die Datenbank einrichten (einmalig):

```bash
# Migrationen anwenden
npx prisma migrate deploy

# Seed-Daten laden
npx prisma db seed
```

> **Tipp:** Diese Befehle lokal ausführen, mit der `DATABASE_URL` der Vercel-Datenbank. Die Connection-URL findest du unter **Storage** → **Postgres** → **.env.local**.

## Lizenz

Dieses Projekt steht unter der [GNU Affero General Public License v3.0](LICENSE).

Das bedeutet: Du darfst den Code nutzen, ändern und weiterverbreiten. Wenn du eine modifizierte Version als Webservice betreibst, musst du den Quellcode deiner Änderungen veröffentlichen.

## Mitwirken

Beiträge sind willkommen! Bitte lies dir die [Contributing Guidelines](CONTRIBUTING.md) durch, bevor du einen Pull Request erstellst.

## Kontakt

Ein Projekt von [EUER NAME] in Kooperation mit dem [StuRa TU Dresden](https://www.stura.tu-dresden.de/).
