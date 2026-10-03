# FOMO – Find Our Matching Organizations

> Finde die Hochschulgruppe, die zu dir passt.

FOMO is an open-source web app that matches TU Dresden freshmen with student organizations through an interactive quiz — like [Wahl-O-Mat](https://www.wahl-o-mat.de/), but for campus life.

Answer 21 questions about your interests, values, and time budget, and get personalized recommendations from 90+ student groups — with contact info, links, and logos.

**Built for:** [StuRa TU Dresden](https://www.stura.tu-dresden.de/) · **🚀 Live:** [www.fomo-dresden.app](https://www.fomo-dresden.app)

## Status

| Phase | Status | Description |
| --- | --- | --- |
| Phase 1: Pilot Study | ✅ Abgeschlossen | 104 Sessions, Classic-Variante gewinnt (45%), Working Set v1.1 eingefroren |
| Phase 2: Group Registration | 🔄 Läuft weiter | Token-Einladungen, Selbst-Registrierung; jede neue Registrierung verbessert das Live-Matching |
| Studie 2: Member Validation | ❌ Verworfen | zu wenig Rücklauf — ersetzt durch anonyme Live-Nutzungsdaten (Umami) |
| Phase 3: Matching & Results | ✅ Live | Working Set v2 (21 Items), Matching v2 client-side in `static-site/` |
| Phase 4: Launch | ✅ Live seit Juli 2026 | **www.fomo-dresden.app** (statische Version, Vercel); Erstiwoche Sept. 2026 = Haupt-Traffic |

Offene Aufgaben: siehe [TODO.md](TODO.md) · Anleitungen für Betrieb und Wartung: [docs/runbooks/](docs/runbooks/README.md) · Hinweise für KI-Agenten: [CLAUDE.md](CLAUDE.md)

### Two apps in this repo

- **Root (`src/`, `prisma/`, …)** — the dynamic Next.js app: admin dashboard,
  group registration, data collection. Needs PostgreSQL. This is the internal
  tool that produces the data.
- **[`static-site/`](static-site/)** — the **live public site**
  ([www.fomo-dresden.app](https://www.fomo-dresden.app)) as a fully static
  export (no server, no DB, client-side matching). It reads PII-free JSON
  baked in at build time; only optional anonymous Umami analytics leave the
  browser. See [`static-site/README.md`](static-site/README.md) for build,
  data pipeline, analytics/report and operations docs
  ([Betriebshandbuch](static-site/docs/BETRIEBSHANDBUCH.md),
  [KI-Mitarbeit](static-site/docs/KI-MITARBEIT.md)).

## Features

### Quiz & Matching (live: `static-site/`)

- **21 Likert questions + 8 activity filters** (Working Set v2) across time budget, values, learning style, and more
- **Client-side matching algorithm** — no user data leaves the browser (DSGVO-friendly)
- **Only verified groups** (self-rated by the group itself) enter the matching; scraped profiles are browse-only
- **Top 5 results** (including boundary ties) normalized to 0–100% match score

### Group Profiles & Registration

- **95 TU Dresden student groups** in the public directory (data export 17.08.2026: 51 verified, 44 unverified)
- **Self-rating:** each group answers the same 21 items + 8 filters as the students; only these verified profiles enter the matching
- **Unverified groups** (not yet registered) get a profile derived from scraped data — shown in the directory only, never in the quiz
- **Token-based edit links** — groups review and update their profile via a secure link (created by an admin, single use, 30 days)
- **Self-registration flow** — 6-step form for groups not yet in the system, including a responsible-person confirmation with contact list storage
- **Admin contact list** — all responsible contacts saved with consent confirmation, exportable as CSV

### Pilot Study (Completed — May 2026)

FOMO ran a **pilot study** to validate the question set and test 4 different UI variants:

| Variant | Style | Description |
| --- | --- | --- |
| 📜 Scroll | Tab-based | All questions of a dimension on one screen with sticky tabs |
| 📋 Classic | Wahl-O-Mat | One question per page with 3 large buttons (Agree / Neutral / Disagree) |
| 👆 Swipe | Tinder-style | Drag or swipe cards left/right to answer |
| 💬 Chat | Messenger | Questions appear as bot messages with emoji reply buttons |

**Result:** Classic won with 45% preference. 104 sessions completed, Working Set v1.1 frozen.

### Security

- Input validation with Zod schemas on all API routes
- Central admin guard (`src/lib/require-admin.ts`): every admin route/page checks the session, active status and role against the database
- Rate limiting on self-registration (in-memory, per IP)
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- No localStorage/sessionStorage (avoids SecurityError in sandboxed environments)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| i18n | [next-intl](https://next-intl-docs.vercel.app/) (DE/EN, `localePrefix: "as-needed"`) |
| Database | [PostgreSQL 16](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) |
| Auth | [Auth.js v5](https://authjs.dev/) (Credentials, Phase 4: TU Dresden Shibboleth/SAML) |
| Validation | [Zod](https://zod.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| Linting | ESLint + Prettier |
| Infrastructure | Docker Compose |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`)
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Setup

```bash
# Clone the repository
git clone https://github.com/SubTVic/Fomo.git
cd Fomo

# Set up environment variables
cp .env.example .env

# Start the database
docker compose up -d db

# Install dependencies
npm install

# Apply database migrations
npx prisma migrate dev

# Seed with sample data
npx prisma db seed

# Start the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Useful Commands

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm run lint             # Linting
npm test                 # Unit tests (Vitest, src/**/*.test.ts)
npm run test:e2e         # End-to-end tests (Playwright, tests/*.spec.ts; needs a local DB)
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create new migration (local DB only)
npm run db:status        # Show pending migrations
npm run db:migrate       # Apply migrations (deliberately, after a backup — see Deployment)
# npm run import:groups  # Legacy CSV import — DESTRUCTIVE, overwrites groups. Do not use.

# Validation scripts (require exported pilot data in data/archives/)
npx tsx scripts/validation/self-recognition-test.ts --verbose
npx tsx scripts/validation/item-discrimination-analysis.ts --output data/item-empirical-validity-report.md
```

## Project Structure

```text
src/
├── app/
│   ├── [locale]/           # i18n routes (DE/EN)
│   │   └── (public)/       # Public pages (landing, group register)
│   │       └── groups/register/    # Token-based & self-registration (6-step form)
│   ├── admin/              # Admin dashboard (protected)
│   │   └── (protected)/
│   │       ├── contacts/   # Contact list (responsible persons, CSV export)
│   │       └── groups/     # Group management, invite links, verify
│   └── api/
│       ├── auth/           # Auth.js handler
│       ├── groups/         # Group registration & attribute submission
│       └── admin/          # Admin: groups, invites, scraper import, verify, backup
├── components/
│   ├── quiz/               # Legacy prototype quiz (page redirects to the live site; removal: plan WP-5.2)
│   ├── variants/           # Pilot study UI variants (legacy)
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Shared layout components
├── lib/
│   ├── study2/items.ts             # The 21 WS2 items used by the registration form
│   ├── require-admin.ts            # Admin guard (session + DB active/role check)
│   ├── normalize-url.ts            # Website/Instagram normalization for group input
│   ├── quiz/                       # Legacy v1 matching (prototype quiz only)
│   ├── rate-limit.ts               # In-memory rate limiter
│   ├── db.ts                       # Prisma singleton
│   └── auth.ts                     # Auth.js configuration
└── types/                  # Shared TypeScript types

data/
├── working-set-v1.json             # 17-item quiz question set (v1.1)
├── hsg-profiles-scraped.json       # 83 group profiles (AI-scraped attributes)
├── group-attributes-schema.json    # Attribute definitions + scraper prompts
├── item-empirical-validity-report.md
└── archives/                       # Pilot data exports

scripts/
├── scraper/                # AI scraper (Anthropic API + web search)
├── validation/
│   ├── self-recognition-test.ts    # Tests if members' answers rank their group top
│   └── item-discrimination-analysis.ts
└── import-*.ts             # Data import utilities

prisma/
├── schema.prisma           # Data model
├── seed.ts                 # Sample data
└── migrations/             # Database migrations
```

## Architecture

### Matching Algorithm

The live matching runs in the browser in [`static-site/src/lib/matching.ts`](static-site/src/lib/matching.ts):

- Users and groups answer the same 21 items with **agree (1) / neutral (0) / disagree (−1)**.
- **Filters are a hard constraint:** if both the user and the group picked activity filters and they don't overlap, the group scores 0.
- Over the user's **non-neutral** answers: `score = round((1 − Σ|user − group| / (n · 2)) · 100)`; with no active answers the score is 50.
- Sorting: unrounded fit, then an explicit filter match, then a deterministic per-user hash (fair tie-breaking that keeps shared `?r=` links stable). The results show the top 5 plus boundary ties (max. 10).
- Only **verified** groups (`getMatchableGroups()`) are ranked.

No user data reaches a server. (The older weighted v1 formula in `src/lib/quiz/` belongs to the retired prototype quiz.)

### Data Model

Core tables: **Group**, **Category**, **GroupSelfRating** + answers (the group's 21-item profile and filters), **GroupInvite** (edit-link tokens), **GroupContact**, **Admin**. Pilot, study 2 and prototype-quiz tables (PilotSession, Study2Session, QuizThesis, …) are kept for archival until plan WP-5.3. The 17 boolean attributes on Group are legacy; they only derive profiles for unverified groups.

**GroupContact** stores responsible persons who self-registered a group (`isResponsible: true`, `source: "self-registration"`). The admin dashboard exposes a contact list view with CSV export and a one-click JSON backup of the entire database.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `APP_LIVE` | No | `true` shows the "start quiz" CTA (links to the live site) on the root landing page; default `false` shows the registration CTAs. (There is no `APP_MODE`.) |
| `ANTHROPIC_API_KEY` | Scraper only | API key for AI-based group profile scraping |
| `DIRECT_URL` | Vercel only | Direct (non-pooled) DB connection for migrations |

## Deployment

### Vercel

1. Connect the GitHub repository in the Vercel dashboard
2. Create a Postgres database under **Storage**
3. Set environment variables under **Settings → Environment Variables**
4. Push to `main` to trigger automatic deployment

**Database migrations never run during the build.** `npm run build` only runs
`next build`; a deploy never changes the database. Migrations are applied by a
person, deliberately and only after a fresh backup:

1. Download a backup (admin area → backup) and store it outside the repository.
2. Check what is pending: `npm run db:status` (with the production `DATABASE_URL`/`DIRECT_URL`).
3. Apply: `npm run db:migrate`.

Deploy code that needs a new migration only after the migration has been applied.

### Docker

```bash
# Start everything (database + app)
docker compose up -d
```

The production app container is defined in `docker-compose.yml` (currently commented out — uncomment when ready).

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Use [conventional commits](https://www.conventionalcommits.org/) in English (`feat:`, `fix:`, `docs:`, etc.)
4. Add `// SPDX-License-Identifier: AGPL-3.0-only` to every new source file
5. Run the checks listed in [CLAUDE.md → Prüfbefehle](CLAUDE.md#prüfbefehle) (the same run in CI)
6. Open a Pull Request — never push to `main` directly (it deploys live)

### Coding Conventions

- Functional components with TypeScript
- Server Components by default, `"use client"` only when needed
- German UI text, English code and comments
- Zod validation for API inputs
- Mobile-first design (80% of users are on mobile)

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

You may use, modify, and distribute this code. If you run a modified version as a web service, you must publish the source code of your changes.

## Contact

A project by [Yeti](https://yeti-dresden.org) in cooperation with the [StuRa TU Dresden](https://www.stura.tu-dresden.de/).
