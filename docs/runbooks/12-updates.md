<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Software-Updates (Abhängigkeiten) einspielen

**Stand: Oktober 2026.** Mindestens **zweimal im Jahr** (z. B. März und August) und
sofort bei Sicherheitswarnungen (GitHub „Dependabot alerts", `npm audit`).
**Braucht technische Begleitung** (oder eine KI mit Review).

## Ablauf (je App: Root und `static-site/`)

1. Branch anlegen, z. B. `chore/updates-2027-03`.
2. Node-Version prüfen: `.nvmrc` (aktuell 24 = LTS bis 04/2028).
3. `npm outdated` ansehen; **Patch-/Minor-Updates** zusammen: `npm update`.
   **Major-Updates** (Next.js, React, Prisma, next-auth) einzeln und mit eigenem PR.
4. `npm audit` — nur `npm audit fix` **ohne** `--force`.
5. Prüfen: Root `npx tsc --noEmit && npm test && npx next build` (Dummy-Env wie in
   [Runbook 05](05-fehlersuche-und-deploy.md#wie-man-selbst-nachsieht-was-kaputt-ist)),
   `static-site`: `npm run lint && npm test && npm run build`. Danach Stichprobe im Browser (375 px):
   Startseite, Quiz bis Ergebnis, Gruppenseite, Admin-Login.
6. PR → CI grün → Preview ansehen → Merge.

## Termine im Blick behalten

- **Next.js 16:** beide Apps seit Oktober 2026 (WP-3.1/3.2). Nächstes Major-Upgrade wieder
  mit Codemod (`npx @next/codemod@latest upgrade`) und Browser-Stichprobe.
- **Prisma 7** bringt Breaking Changes — eigenes Paket, nicht mit anderen Umbauten mischen.
