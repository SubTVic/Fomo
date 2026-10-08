# FOMO — Static Public Site

The public-facing FOMO app as a **fully static** export (`next build` →
`out/`). No server, no database, no API routes — just HTML/JS plus the JSON
data baked in at build time. Hosts anywhere static (Vercel static, S3, GitHub
Pages, a Uni server). **Live at https://www.fomo-dresden.app** (Vercel, deploys
on every push to `main`). DSGVO-friendly: the quiz and matching run entirely in
the browser; the only thing that ever leaves it is optional anonymous Umami
analytics (see Analytics below and the Datenschutz page).

The dynamic app in the repo root stays the data-collection tool (admin,
group registration and edit links) and is untouched by this folder.

## Develop & build

```bash
cd static-site
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (matching, share links, data, report parity)
npm run build    # → static-site/out/  (the deployable bundle)
```

`npm run build` first runs `prebuild`: the data gate `scripts/validate-data.mjs`
(broken data stops the build — also on Vercel) and the report generator. CI
(`.github/workflows/ci.yml`) runs validate, typecheck, tests and build on every PR.

## Data

All content comes from JSON files in `data/`, baked in at build time:

| File | Content | Who changes it |
| --- | --- | --- |
| `groups.json` | All active, PII-free groups, each with a `selfRating` | **Generated** from the admin app's DB by the Daten-Sync — never edit by hand |
| `quiz.json` | Quiz `items` (21 Likert questions) + 8 `filters` | By PR; must stay identical to `data/working-set-v2.json` in the root (CI checks) |
| `categories.json` | Categories: name DE/EN, colour, SEO landing page | By PR; a new category in the DB must be added here or validation fails |
| `group-translations.json` | English group descriptions + `sourceHash` of the German text | By PR; validation warns when the German text changed since |
| `logos.json` | Slug → logo path overlay (a group's own `logoUrl` wins) | By PR, logo files in `public/group-logos/` |
| `report-milestones.json` | Dated changes the `/report/` splits its numbers at | By PR after matching/data changes |

How `groups.json` gets updated: admin app → GitHub Action „Daten-Sync“ → PR with a
change list → merge (step by step: `docs/runbooks/01-gruppe-aendern.md`). The code
is generic against the data shape (`src/lib/types.ts`), so a trimmed item pool
(working set v3) needs no code change — but see `docs/runbooks/07-quiz-item-aendern.md`
before touching items.

**Verified vs. unverified:** a group whose profile was auto-derived (scraped)
carries `selfRating.derived: true`. Such groups are **excluded from quiz
matching** (`getMatchableGroups()` in `src/lib/data.ts`) and only appear when
browsing `/groups` behind the "unbestätigt" toggle — their data is a fallback,
never a ranking input. A real registration overrides the scrape and flips it to
verified.

## Data pipeline (scripts/)

Refreshing `data/groups.json` without prod DB access — full concept in
[`docs/SCRAPING-KONZEPT.md`](docs/SCRAPING-KONZEPT.md):

| Script | npm | Purpose |
| --- | --- | --- |
| `scrape-groups.mjs` | `scrape` | Keyword scraper → `selfRating` directly (offline, no key). |
| `scrape-llm.mjs` | `scrape:llm` | LLM scraper (Claude reads the "Über uns" text). Needs `ANTHROPIC_API_KEY`; falls back to the keyword scraper per group on any error or with `--offline`. |
| `derive-selfrating.mjs` | `derive` | Merge: real registrations (`--overrides`) always win over scraped data. |
| `export-from-backup.mjs` | — | Emergency path: rebuild `groups.json` from an admin backup JSON. Output is identical to the Daten-Sync exporter `src/lib/export/static-groups.ts` (a root test enforces it). |
| `diff-groups.mjs` | — | Human-readable change list between two `groups.json` (used in the Daten-Sync PR). |
| `report.mjs` | `report` | Analytics report (see below); also runs in `prebuild`. |
| `scrape-eval.mjs`, `train-derive-model.mjs` | `scrape:eval`, `derive:train` | Measure / train the scraper's derivation against verified groups. |
| `validate-data.mjs` | `validate` | Integrity gate; runs automatically before every build (ratings, slugs, filters, categories from `data/categories.json`, links of verified groups). |
| `update-data.sh` | — | Build + zero-downtime symlink swap (see `docs/INBETRIEBNAHME.md`). |

The LLM scraper needs `@anthropic-ai/sdk` (run `npm install`) and uses
`claude-opus-4-8` with adaptive thinking.

## Matching (client-side, v2)

`src/lib/matching.ts` — mean-absolute-distance between the user's non-neutral
answers and each group's self-rating, with a filter hard-constraint:

- `score = round((1 − Σ|user − group| / (n · 2)) · 100)` over the n non-neutral answers.
- Filters: if both sides chose filters and they don't overlap, the group is excluded.
- Ties: unrounded fit → explicit filter match → per-user hash (stable for `?r=` links).
- Shown: top 5 plus boundary ties (`topWithTies`, max. 10).
- **Minimum rule:** below `MIN_ACTIVE_ANSWERS` (5) non-neutral answers the results
  screen shows a hint and „Antworten ändern“ instead of a ranking.
- Only verified groups (`getMatchableGroups()`).

`scripts/report.mjs` carries a copy of the matcher for its bias simulation;
`src/lib/__tests__/report-parity.test.ts` keeps both in sync.

## Operations

**Non-technical handover:** [`docs/BETRIEBSHANDBUCH.md`](docs/BETRIEBSHANDBUCH.md)
— accounts, routine tasks (data updates, logos, texts), troubleshooting and the
yearly maintenance calendar, written for non-developers.

Self-hosting on a StuRa server (Docker or plain Node + nginx) and zero-downtime
data swaps are documented in [`docs/INBETRIEBNAHME.md`](docs/INBETRIEBNAHME.md).
The live site deploys via Vercel instead: every push to `main` that touches
`static-site/` rebuilds and publishes automatically.
Which usage data we collect (anonymous, Umami) is in
[`docs/DATEN-SAMMELN-KONZEPT.md`](docs/DATEN-SAMMELN-KONZEPT.md).
Open tasks (admin + code) live in the root [`TODO.md`](../TODO.md).

## SEO

The site ships full SEO for static export: per-page titles/descriptions,
canonical + `hreflang` DE↔EN, OpenGraph/Twitter cards, an OG image
(`public/og.png`), favicon (`app/icon.svg`), JSON-LD (`WebSite` + `Organization`
site-wide, a per-group `Organization` on each detail page), and generated
`sitemap.xml` + `robots.txt` (`app/sitemap.ts`, `app/robots.ts`).

Set the canonical origin so all absolute URLs are correct:

- `NEXT_PUBLIC_SITE_URL` — the public origin, e.g. `https://fomo.example.de`
  (no trailing slash). On Vercel it falls back to the project's production URL;
  locally it falls back to `http://localhost:3000`. **Set this to the real
  custom domain in production** — sitemap, canonical and OG URLs depend on it.

After launch, submit `https://<domain>/sitemap.xml` in Google Search Console.

## Analytics

Umami is wired via `src/components/UmamiScript.tsx` and only loads when
configured (build-time env, no `NEXT_PUBLIC_` prefix needed):

- `UMAMI_WEBSITE_ID` — website UUID (required to enable; the legacy name
  `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is still honoured)
- `UMAMI_SRC` — script URL (defaults to Umami Cloud)

Query strings are never recorded (`data-exclude-search`), because the results
link carries the encoded answers.

**Data before 3 Oct 2026:** "Antworten ändern" re-fired `quiz-complete`,
`quiz-response` and `quiz-item-view`, so older numbers are inflated (completions
can exceed starts). Since then every run counts once; `report-milestones.json`
marks the date.

Tracked events (all anonymous, no identifier — see `src/lib/analytics.ts` for
the full list and `docs/DATEN-SAMMELN-KONZEPT.md` for the rationale):

- **Funnel:** `quiz-start` (incl. selected filters), `quiz-item-view` (per
  question, for drop-off analysis), `quiz-item-back`, `quiz-complete`,
  `quiz-response` (the 21 answers + filters), `quiz-result-group` (one event
  per initially shown result — top 5 incl. boundary ties: `group` slug,
  `rank`, `score` — the frequency table for "which groups come out of the
  quiz, how often"), `quiz-edit` (re-entering the questions from the
  results; the re-run does not fire the funnel/response events again),
  `quiz-restart`
- **Results interaction:** `results-tab`, `results-show-more`,
  `results-zero-hits`, `results-too-few-answers` (results withheld below
  5 non-neutral answers), `results-feedback` (👍/👎), `results-share-copy`,
  `results-share-qr` (`action`: show/download),
  `self-recognition` (voluntary "already a member? which group?" + the rank
  our ranking gave that group — the passive self-recognition study)
- **Group engagement:** `group-click` (`dest`: website/instagram/email,
  `context`: browse/results/detail, `rank` where applicable),
  `group-detail-open`
- **Browsing:** `groups-category-filter`, `groups-show-unverified`
- **i18n:** `lang-switch`

### Report generator

`npm run report` pulls the events from the Umami API and writes a single
self-contained HTML report (`fomo-report.html`): answer distribution per
question (full question text), filter choices, drop-off funnel, which groups
the quiz recommends and how often, plus a bias analysis that simulates
thousands of profiles against the real matcher. Auth via env — either
`UMAMI_API_KEY` (Umami Cloud, needs a plan with API access) or
`UMAMI_URL` + `UMAMI_USER` + `UMAMI_PASSWORD` (self-hosted, API always
included); both need `UMAMI_WEBSITE_ID`. `--offline` builds the
simulation-only bias report without any API access.

The report is also **built into the live site**: `npm run build` runs the
generator first (prebuild) and ships the result at **`/report/`** (public,
`noindex` + robots-disallowed; contains anonymous aggregates only). It never
blocks a deploy — API failures degrade to the simulation-only report. Set
`UMAMI_API_KEY` + `UMAMI_WEBSITE_ID` (no `NEXT_PUBLIC_` prefix — build-time
only) in the Vercel project to fill it with live data. A daily GitHub Action
(`.github/workflows/weekly-report-redeploy.yml`, also manually triggerable)
POSTs a Vercel Deploy Hook so the numbers refresh without a code push — it
needs the `VERCEL_DEPLOY_HOOK_URL` repo secret once.
