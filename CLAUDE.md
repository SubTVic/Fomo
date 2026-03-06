# FOMO – Projektkontext für Claude Code

## Was ist FOMO?

FOMO ist eine Open-Source-Webanwendung (AGPL-3.0), mit der Erstsemester der TU Dresden über ein Quiz passende Hochschulgruppen finden. Das Prinzip ist wie beim Wahl-O-Mat: ~20 Fragen beantworten → Algorithmus berechnet Matching → Top-Ergebnisse anzeigen.

**Auftraggeber:** StuRa TU Dresden
**Team:** 2 Entwickler
**Launch:** September 2026 (Erstsemester-Woche)

## Tech-Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Datenbank:** PostgreSQL 16
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth v5) – Phase 1: Credentials, Phase 2: SAML/SSO
- **Deployment:** Docker Compose
- **Testing:** Vitest + Playwright
- **Linting:** ESLint + Prettier
- **Lizenz:** AGPL-3.0

## Architektur-Prinzipien

1. **Mobile-first:** 80% der Nutzer sind auf dem Handy (18-25 Jahre, Erstis).
2. **Client-side Matching:** Der Matching-Algorithmus läuft im Browser. Fragen + Gruppenprofile werden einmal geladen, dann wird lokal gerechnet. Keine Nutzerdaten werden an den Server geschickt → DSGVO-freundlich.
3. **Docker-first:** Die App muss mit `docker compose up` komplett lauffähig sein. Hosting ist noch unklar (Uni-RZ oder VPS).
4. **Kein localStorage/sessionStorage:** Kann SecurityError in Sandbox-Umgebungen werfen. State nur über React State oder URL-Parameter.
5. **Seed-Daten:** Das Prisma-Seed-Skript muss realistische Beispieldaten enthalten (mind. 5 Gruppen, alle Fragetypen), damit man sofort entwickeln und testen kann.

## Datenmodell

Das vollständige Prisma-Schema liegt in `prisma/schema.prisma`. Die wichtigsten Entities:

- **Category** – Gruppenkategorien (Politik, Sport, Kultur, etc.)
- **Group** – Hochschulgruppen mit Kontaktdaten
- **Question** – Quiz-Fragen (5 Typen: LIKERT, SINGLE_CHOICE, MULTI_CHOICE, YES_NO, SLIDER)
- **QuestionOption** – Antwortoptionen für Choice-Fragen
- **GroupProfile** – Antwort einer Gruppe auf eine Frage (= ihr "Profil")
- **Admin** – Admin-Nutzer mit Rollen (SUPER_ADMIN, EDITOR)
- **QuizSession** – Anonyme Analytics (wann gestartet/abgeschlossen)

## Matching-Algorithmus

```
score(User, Group) = Σ weight_i × similarity(user_answer_i, group_profile_i)

similarity:
  LIKERT/SLIDER: 1 - |user - group| / max_range
  YES_NO:        1 wenn gleich, 0 sonst
  SINGLE_CHOICE: 1 wenn gleich, 0 sonst
  MULTI_CHOICE:  Jaccard-Index = |Schnitt| / |Vereinigung|

Ergebnis: Top 5-10 Gruppen, normalisiert auf 0-100%
```

## Projektstruktur

```
src/
├── app/
│   ├── (public)/           # Öffentliche Routen (kein Auth)
│   │   ├── page.tsx        # Landing Page
│   │   ├── quiz/page.tsx   # Quiz
│   │   ├── results/page.tsx # Ergebnisse
│   │   └── groups/page.tsx # Hochschulgruppen-Übersicht
│   ├── admin/              # Admin-Bereich (Auth required)
│   │   ├── layout.tsx      # Auth-Check
│   │   ├── page.tsx        # Dashboard
│   │   ├── groups/         # Gruppen-CRUD
│   │   ├── questions/      # Fragen-CRUD
│   │   └── analytics/      # Anonyme Statistiken
│   ├── api/                # API-Routen
│   └── layout.tsx          # Root Layout
├── components/
│   ├── ui/                 # shadcn/ui Basis
│   ├── quiz/               # Quiz-Komponenten
│   ├── admin/              # Admin-Komponenten
│   └── shared/             # Geteilte Komponenten
├── lib/
│   ├── matching.ts         # Matching-Algorithmus (WICHTIG: gut testen!)
│   ├── db.ts               # Prisma Client Singleton
│   ├── auth.ts             # Auth.js Config
│   └── utils.ts
└── types/index.ts
```

## Coding-Konventionen

- Alle Komponenten als funktionale Components mit TypeScript
- Server Components by default, 'use client' nur wenn nötig
- API-Routen mit Zod-Validation für Input
- Prisma-Queries nur in Server Components oder API-Routen
- Deutsche UI-Texte, englische Code-Kommentare und Variablennamen
- SPDX-Header in jeder Datei: `// SPDX-License-Identifier: AGPL-3.0-only`
- Commits auf Englisch, konventionelle Commit-Messages (feat:, fix:, docs:, etc.)

## Wichtige Hinweise

- **Kein Mat-O-Wahl-Code verwenden.** Wir bauen komplett neu.
- **AGPL-3.0:** Jede Quellcode-Datei braucht den SPDX-Header.
- **Seed-Daten auf Deutsch:** Die App ist für TU Dresden, Beispieldaten müssen auf Deutsch sein.
- **Responsive:** Jede Seite muss auf 375px Breite gut aussehen.
