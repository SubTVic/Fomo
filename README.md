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

Offene Aufgaben: siehe [TODO.md](TODO.md)

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

- **83 TU Dresden student groups** from the StuRa directory
- **AI-scraped attributes** via Anthropic API with web search — 17 boolean matching attributes per group
- **Token-based invite links** — groups review and correct their scraped profile via a secure link (email optional)
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
- Rate limiting (10 submissions/hour per IP) with automatic cleanup
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- No localStorage/sessionStorage (avoids SecurityError in sandboxed environments)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router, TypeScript) |
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

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Setup

```bash
# Clone the repository
git clone https://github.com/SubTVic/Fomo.git
cd Fomo/Github/fomo

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
npm run test             # Run unit tests (Vitest)
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create new migration
npm run import:groups    # Import groups from CSV

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
│   ├── quiz/               # Live quiz components
│   │   ├── QuizRouter.tsx          # Quiz orchestrator (welcome → quiz → results)
│   │   ├── QuizWelcome.tsx         # Welcome screen
│   │   └── results/               # Result display
│   ├── variants/classic/   # Classic (Wahl-O-Mat style) quiz variant
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Shared layout components
├── lib/
│   ├── quiz/                       # Live quiz logic
│   │   ├── types.ts                # QuizThesisData, QuizGroupData, etc.
│   │   ├── matching.ts             # Client-side matching algorithm
│   │   ├── attribute-labels.ts     # German labels for group attributes
│   │   └── __tests__/             # Vitest unit tests
│   ├── queries/quiz.ts             # Server-side quiz queries
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

```text
score(User, Group) = Σ effWeight_i × similarity_i / Σ effWeight_i

effWeight_i = userWeight_i × attrWeight_attr × (1 / itemCount_attr)
```

- **3 answer options:** Agree (1.0), Neutral (0.5), Disagree (0.0)
- **User weight:** `|normalized - 0.5| × 2` — Neutral answers have zero weight (ignored)
- **Attribute weight:** `2 × min(yes, no) / n` — attributes with a 50/50 split across groups score highest; all-same attributes score 0
- **Item-count normalization:** `1 / itemCount_attr` — prevents attributes mapped by multiple questions from dominating the score
- **Similarity:** `1 - |userValue - groupAttribute|` (with inverse-mapping support)
- **Minimum threshold:** ≥ 5 non-neutral answers required, otherwise no results shown

Results are normalized to 0–100% and sorted descending. All computation runs client-side — no user data ever reaches the server.

### Data Model

The schema covers the **production quiz** (QuizThesis, QuizThesisAttribute, Group, Category, GroupInvite) and retains pilot study tables (PilotSession, PilotAnswer) for archival. Groups have 17 boolean matching attributes. Each QuizThesis maps to one or more group attributes (optionally inverse) and carries optional `hint`/`textEn`/`hintEn` fields for bilingual display.

**GroupContact** stores responsible persons who self-registered a group (`isResponsible: true`, `source: "self-registration"`). The admin dashboard exposes a contact list view with CSV export and a one-click JSON backup of the entire database.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `APP_LIVE` | No | `true` switches landing CTA to live quiz; default `false` shows prelaunch CTAs |
| `ANTHROPIC_API_KEY` | Scraper only | API key for AI-based group profile scraping |
| `DIRECT_URL` | Vercel only | Direct (non-pooled) DB connection for migrations |

## Deployment

### Vercel

1. Connect the GitHub repository in the Vercel dashboard
2. Create a Postgres database under **Storage**
3. Set environment variables under **Settings → Environment Variables**
4. Push to `main` to trigger automatic deployment
5. Run `npx prisma migrate deploy` locally against the production DB (one-time)

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
5. Ensure `npm run build` passes
6. Open a Pull Request

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

A project by [Yeti](yeti-dresden.org) in cooperation with the [StuRa TU Dresden](https://www.stura.tu-dresden.de/).
