# FOMO – Find Our Matching Organizations

> Finde die Hochschulgruppe, die zu dir passt.

FOMO is an open-source web app that matches TU Dresden freshmen with student organizations through an interactive quiz — like [Wahl-O-Mat](https://www.wahl-o-mat.de/), but for campus life.

Answer ~20 questions about your interests, values, and time budget, and get personalized recommendations from 100+ student groups — with contact info, links, and logos.

**Built for:** [StuRa TU Dresden](https://www.stura.tu-dresden.de/) · **Target launch:** Orientation Week WS 26/27

## Features

### Quiz & Matching
- **~20 questions** across categories like time budget, politics, sports, culture, and more
- **Client-side matching algorithm** — no user data leaves the browser (DSGVO-friendly)
- **Weighted scoring** with support for Likert, Yes/No, Single/Multi Choice, and Slider questions
- **Top results** normalized to 0–100% match score

### Pilot Study (Current Phase)
FOMO is currently running a **pilot study** to validate the question set and test 4 different UI variants:

| Variant | Style | Description |
|---------|-------|-------------|
| 📜 Scroll | Tab-based | All questions of a dimension on one screen with sticky tabs |
| 📋 Classic | Wahl-O-Mat | One question per page with 3 large buttons (Agree / Neutral / Disagree) |
| 👆 Swipe | Tinder-style | Drag or swipe cards left/right to answer |
| 💬 Chat | Messenger | Questions appear as bot messages with emoji reply buttons |

**Pilot flow:** Each participant sees all 4 variants in randomized order (Fisher-Yates shuffle), answering 60 statements across 10 dimensions. After all blocks, they provide demographic data and rate their preferred UI variant.

### Preview Mode
- `?preview=true` — full survey without saving answers to DB (shareable test link)
- `?preview=quick` — only 2 questions per dimension for fast design testing

### Data Export
- Protected API endpoint (`/api/pilot/export`) for downloading responses
- Supports JSON and CSV format with pagination
- Secured via Bearer token (`PILOT_EXPORT_KEY` env var)

### Psychometric Analysis
Built-in statistics for evaluating question quality:
- **Cronbach's Alpha** per dimension (internal consistency)
- **Corrected Item-Total Correlation (r_it)** per item
- **Mean, SD, and distribution** analysis
- Color-coded quality indicators (green/yellow/red)

### Security
- Input validation with Zod schemas on all API routes
- Rate limiting (10 submissions/hour per IP) with automatic cleanup
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Unique constraints on database to prevent duplicate answers
- No localStorage/sessionStorage (avoids SecurityError in sandboxed environments)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, TypeScript) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | [PostgreSQL 16](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) |
| Auth | [Auth.js v5](https://authjs.dev/) (Phase 1: Credentials, Phase 2: TU Dresden Shibboleth/SAML) |
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
npm run test             # Run tests
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create new migration
npm run import:groups     # Import groups from CSV
```

## Project Structure

```
src/
├── app/
│   ├── (public)/           # Public pages (landing, pilot intro)
│   ├── (fullscreen)/       # Full-screen layouts (survey)
│   ├── (admin)/            # Admin dashboard (protected)
│   └── api/
│       ├── auth/           # Auth.js handler
│       └── pilot/
│           ├── submit/     # Survey submission endpoint
│           └── export/     # Data export endpoint
├── components/
│   ├── survey/             # Survey orchestration & shared components
│   │   ├── SurveyRouter.tsx        # Main flow controller (phases)
│   │   ├── useSurveyState.ts       # Answer state management hook
│   │   ├── PrimingScreen.tsx       # Context-setting intro screen
│   │   ├── VariantTransition.tsx   # Between-block transition
│   │   ├── MidSurveyReminder.tsx   # Halfway encouragement
│   │   ├── PreferenceQuestion.tsx  # "Which variant did you prefer?"
│   │   ├── DimensionHeader.tsx     # Dimension label + priming
│   │   └── question-inputs/       # Reusable input components
│   ├── variants/
│   │   ├── scroll/ScrollSurvey.tsx
│   │   ├── classic/ClassicSurvey.tsx
│   │   ├── swipe/SwipeSurvey.tsx
│   │   ├── chat/ChatSurvey.tsx
│   │   └── types.ts               # Shared variant interface
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Shared layout components
├── lib/
│   ├── pilot-questions.ts          # 60 pilot questions + 10 dimensions
│   ├── pilot-variant-order.ts      # Block generation & variant shuffling
│   ├── pilot-statistics.ts         # Psychometric analysis
│   ├── dimension-priming.ts        # Contextual frames per dimension
│   ├── matching.ts                 # Client-side matching algorithm
│   ├── rate-limit.ts               # In-memory rate limiter
│   ├── db.ts                       # Prisma singleton
│   └── auth.ts                     # Auth.js configuration
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma           # Data model
├── seed.ts                 # Sample data
└── migrations/             # Database migrations
```

## Architecture

### Matching Algorithm

```
score(User, Group) = Σ weight_i × similarity(user_answer_i, group_profile_i) / Σ weight_i
```

Similarity functions by question type:
- **Likert / Slider:** `1 - |user - group| / max_range`
- **Yes/No / Single Choice:** `1` if equal, `0` otherwise
- **Multi Choice:** Jaccard index (`|intersection| / |union|`)

Results are normalized to 0–100% and sorted descending. All computation runs client-side.

### Pilot Survey Flow

```
Priming → [Block 1] → Mid-Reminder → [Block 2] → [Block 3] → [Block 4]
       → Demographics → Feedback → Variant Preference → Done
```

Each block uses a different randomized UI variant. Dimensions are grouped into 4 blocks (2–3 dimensions each), and questions within each block are presented using that block's assigned variant.

### Data Model

The schema supports both the **pilot study** (PilotDimension, PilotSurveyQuestion, PilotSession, PilotAnswer) and the **production quiz** (Question, QuestionOption, GroupProfile, Group, Category). Groups have 65+ boolean attributes for fine-grained matching.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `APP_MODE` | Yes | `pilot`, `collect`, or `live` |
| `PILOT_EXPORT_KEY` | For export | Bearer token for `/api/pilot/export` |

## Deployment

### Vercel

1. Connect the GitHub repository in the Vercel dashboard
2. Create a Postgres database under **Storage**
3. Set environment variables under **Settings → Environment Variables**
4. Push to `main` to trigger automatic deployment
5. Run `npx prisma migrate deploy` and `npx prisma db seed` locally against the production DB (one-time)

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

A project by [Yeti](https://github.com/SubTVic) in cooperation with the [StuRa TU Dresden](https://www.stura.tu-dresden.de/).
