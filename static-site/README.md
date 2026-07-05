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

Self-hosting on a StuRa server (Docker or plain Node + nginx) and zero-downtime
data swaps are documented in [`docs/INBETRIEBNAHME.md`](docs/INBETRIEBNAHME.md).
Which usage data we collect (anonymous, Umami) is in
[`docs/DATEN-SAMMELN-KONZEPT.md`](docs/DATEN-SAMMELN-KONZEPT.md).

## Analytics

Umami is wired via `src/components/UmamiScript.tsx` and only loads when
configured:

- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — website UUID (required to enable)
- `NEXT_PUBLIC_UMAMI_SRC` — script URL (defaults to Umami Cloud)

Tracked events: `quiz-start`, `quiz-complete`, `group-click`.

## Optional response tracking

The static quiz can send anonymous quiz responses to a Google Sheets-backed
Apps Script endpoint when the user finishes the quiz. Configure:

- `NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL` - deployed Google Apps Script web app URL

Only the quiz answers, selected filters, and `submittedAt` timestamp are sent.
No name, email, result link, user agent, or tracking ID is included.

Example Apps Script for the FOMO response sheet:

```js
const SPREADSHEET_ID = "1Jh3Q1kEpVAL_z3rx0WECKJUOqRz9Ce3nKpbkeOvA1Uk";
const SHEET_NAME = "Responses";

function doPost(e) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.submittedAt,
    JSON.stringify(data.answers),
    JSON.stringify(data.filters),
  ]);

  return ContentService.createTextOutput("ok");
}
```

Deploy the script as a web app with access set to "Anyone". Leave
`NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL` unset to keep the fully local,
no-submission behavior.
