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

All content comes from two JSON files — no code change needed to refresh it:

- `data/groups.json` — verified, PII-free groups (each with a `selfRating`).
- `data/quiz.json` — quiz `items` (Likert questions) + `filters`.

To update the live data: replace these files and rebuild. The code is generic
against their shape (see `src/lib/types.ts`), so swapping the WS2 item pool for
a trimmed working-set-v3 just works.

## Matching (client-side, v2)

`src/lib/matching.ts` — mean-absolute-distance between the user's non-neutral
answers and each group's self-rating, with a filter hard-constraint. See
`CLAUDE.md` for the algorithm background.

## Analytics

Umami is wired via `src/components/UmamiScript.tsx` and only loads when
configured:

- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — website UUID (required to enable)
- `NEXT_PUBLIC_UMAMI_SRC` — script URL (defaults to Umami Cloud)

Tracked events: `quiz-start`, `quiz-complete`, `group-click`.
