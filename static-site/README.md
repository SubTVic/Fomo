# FOMO — Static Public Site

The public-facing FOMO app as a **fully static** export (`next build` →
`out/`). No server, no database, no API routes — just HTML/JS plus the JSON
data baked in at build time. Hosts anywhere static (Vercel static, S3, GitHub
Pages, a Uni server). DSGVO-friendly: the quiz and matching run entirely in the
browser, no user data is sent anywhere.

The dynamic app in the repo root stays the data-collection tool (admin,
registration, Study 2) and is untouched by this folder.

## Develop & build

```bash
cd static-site
npm install
npm run dev      # http://localhost:3000
npm run build    # → static-site/out/  (the deployable bundle)
```

## Data

All content comes from three JSON files — no code change needed to refresh it:

- `data/groups.json` — all active, PII-free groups (each with a `selfRating`).
- `data/quiz.json` — quiz `items` (Likert questions) + `filters`.
- `data/logos.json` — optional slug → logo overlay (a group's own `logoUrl` wins).

To update the live data: replace these files and rebuild. The code is generic
against their shape (see `src/lib/types.ts`), so swapping the WS2 item pool for
a trimmed working-set-v3 just works.

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
| `export-from-backup.mjs` | — | Rebuild `groups.json` from an admin backup JSON (mirrors the prod exporter). |
| `validate-data.mjs` | `validate` | Integrity gate before going live. |
| `update-data.sh` | — | Build + zero-downtime symlink swap (see `docs/INBETRIEBNAHME.md`). |

The LLM scraper needs `@anthropic-ai/sdk` (run `npm install`) and uses
`claude-opus-4-8` with adaptive thinking.

## Matching (client-side, v2)

`src/lib/matching.ts` — mean-absolute-distance between the user's non-neutral
answers and each group's self-rating, with a filter hard-constraint. See
`CLAUDE.md` for the algorithm background.

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
configured:

- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — website UUID (required to enable)
- `NEXT_PUBLIC_UMAMI_SRC` — script URL (defaults to Umami Cloud)

Tracked events (all anonymous, no identifier — see `src/lib/analytics.ts` for
the full list and `docs/DATEN-SAMMELN-KONZEPT.md` for the rationale):

- **Funnel:** `quiz-start` (incl. selected filters), `quiz-item-view` (per
  question, for drop-off analysis), `quiz-item-back`, `quiz-complete`,
  `quiz-response` (the 21 answers + filters), `quiz-result-group` (one event
  per top-5 result: `group` slug, `rank`, `score` — the frequency table for
  "which groups come out of the quiz, how often"), `quiz-restart`
- **Results interaction:** `results-tab`, `results-show-more`,
  `results-zero-hits`, `results-feedback` (👍/👎), `results-share-copy`
- **Group engagement:** `group-click` (`dest`: website/instagram/email,
  `context`: browse/results/detail, `rank` where applicable),
  `group-detail-open`
- **Browsing:** `groups-category-filter`, `groups-show-unverified`
- **i18n:** `lang-switch`
