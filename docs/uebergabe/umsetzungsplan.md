<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Umsetzungsplan FOMO: stabilisieren, wartbar machen, auf den StuRa-Server umziehen

**Stand:** 03.10.2026 · **Für:** eine KI-Coding-Instanz (Claude Code, z. B. mit Sonnet)
und die Menschen, die sie anleiten. **Grundlage:** `docs/uebergabe/audit.md` (Befunde)
und `docs/uebergabe/recherche-umsetzung.md` (Recherche, Zielbild, Quellen).

**Ziel am Ende:** FOMO läuft komplett auf einem Server des StuRa (statische Seite,
Registrierungs-/Admin-App, Datenbank, Statistik, Backups, Monitoring), hängt an keinem
Privat-Account mehr, Gruppen pflegen ihre Daten selbst über einen dauerhaften Link, und
eine Änderung ist per Klick „Website aktualisieren" in ~1 Minute live.

---

## 0. So wird dieser Plan benutzt

### Für Menschen
1. Pro Sitzung **genau ein Arbeitspaket (WP)** an die KI geben. Prompt-Vorlage: §8.
2. Schritte mit **🧑** kann die KI nicht selbst erledigen (Zugänge, Entscheidungen,
   Produktion). Die KI stoppt dort und schreibt auf, was zu tun ist.
3. Jede KI-Änderung kommt als **Pull Request**. Vor dem Merge: CI grün,
   Preview ansehen, PR-Beschreibung lesen.
4. Offene **Entscheidungen (E1–E9, §2)** möglichst früh treffen; einige WPs warten darauf.

### Für die KI
- Lies vor jedem WP: `CLAUDE.md`, diesen Plan (§1 Regeln + dein WP), und die im WP
  genannten Dateien. **Rate nicht** — wenn der Code anders aussieht als im WP
  beschrieben, beschreibe die Abweichung und schlage eine Anpassung vor.
- Ein WP = ein Branch `wp-<nr>-<kurzname>` (z. B. `wp-1-2-require-admin`) = ein PR.
- Am Ende jedes WPs: Prüfbefehle aus dem WP ausführen, Ergebnisse wörtlich berichten,
  Status in §9 dieses Plans auf ✅ setzen (im selben PR), PR-Beschreibung entwerfen.

---

## 1. Globale Regeln für die KI (gelten in jedem WP, nicht verhandelbar)

1. **Nie direkt auf `main` pushen.** `main` deployt live. Immer Branch + PR.
2. **Keine Verbindung zu Produktivsystemen** (Prod-DB, Vercel, Umami, StuRa-Server) und
   keine echten Zugangsdaten verwenden. Nur lokale Test-DB (Docker/Postgres lokal).
3. **Keine Datenbank-Migration gegen eine nicht-lokale DB** (`prisma migrate deploy`,
   `migrate reset`, `db push`). Migrationen nur erzeugen und lokal testen; ausführen tut
   ein Mensch (🧑) nach einem Backup.
4. **Nie `.env*`, Backup-Dateien (`fomo-backup-*.json`) oder Secrets lesen, erzeugen
   oder committen.** Beispielwerte nur in `.env.example`.
5. **Nie Git-History umschreiben** (kein `rebase` auf geteilten Branches, kein
   `filter-repo`, kein Force-Push).
6. **`static-site/data/groups.json` nie von Hand bearbeiten.** Die Datei wird aus der DB
   erzeugt. Ausnahme: Ein WP sagt ausdrücklich etwas anderes (Sync-Werkzeug).
7. **Quiz-Matching nur mit verifizierten Gruppen** (`getMatchableGroups`, nie
   `getGroups`). Item-IDs, Item-Reihenfolge und Filternamen nicht ändern
   (geteilte `?r=`-Links und der Report hängen positionsbasiert daran).
8. **Kein `localStorage`/`sessionStorage`.** State nur über React-State oder URL.
9. **SPDX-Header** in jeder neuen Quellcode-Datei: `// SPDX-License-Identifier: AGPL-3.0-only`
   (in Markdown: `<!-- SPDX-License-Identifier: AGPL-3.0-only -->`).
10. **Deutsche UI-Texte**, englische Code-Kommentare/Variablen, englische konventionelle
    Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
11. **Kleinster sinnvoller Diff.** Kein „Aufräumen nebenbei" außerhalb des WPs; Funde
    stattdessen in `TODO.md` notieren.
12. **Bei Unsicherheit stoppen und fragen** statt raten — besonders bei allem, was Daten
    löscht, Sicherheit betrifft oder Nutzer:innen sichtbar ändert.
13. Sicherheitsdetails (wie man eine Lücke auslöst) **nicht** in Commits, PRs oder
    öffentliche Doku schreiben — das Repo ist öffentlich.

---

## 2. Entscheidungen, die Menschen treffen müssen

| ID | Frage | Empfohlener Default | Blockiert |
|---|---|---|---|
| **E1** | Gehen Änderungen **bereits verifizierter** Gruppen ohne erneute Freigabe live? | **Ja**, mit Änderungsprotokoll + „Rückgängig" für Admins | WP-4.1 |
| **E2** | Git-History von `data/admin-export.json` (Pilot-Freitexte) bereinigen? | **Ja**, vor der Übergabe, durch den Repo-Owner (`git filter-repo`), danach alle Klone neu | WP-1.8 (nur Doku) |
| **E3** | Woher kommt **SMTP** für Bearbeitungslinks (StuRa-Mailserver/Funktionspostfach)? | Funktionspostfach des StuRa, z. B. `fomo@…` | WP-4.3 |
| **E4** | Bleibt die Domain **fomo-dresden.app**? | **Ja** (SEO, Links); Admin-App unter `verwaltung.fomo-dresden.app` | WP-6.2 |
| **E5** | **Reverse-Proxy:** bringen wir Caddy mit oder nutzt der StuRa einen eigenen? | Caddy mitbringen, abschaltbar per Compose-Profil | WP-6.2 |
| **E6** | **Zusatzschutz Admin:** Basic-Auth am Proxy, IP-Beschränkung oder TU-Shibboleth? | Basic-Auth am Proxy jetzt, Shibboleth später prüfen | WP-6.2 |
| **E7** | Statistik **datensparsamer**? (voller Antwortvektor `r` in Feedback-/Selbsterkennungs-Events, Gruppenmitgliedschaft) | Datenschutzbeauftragte:n fragen; bis dahin unverändert | WP-5.6 |
| **E8** | Code-Hosting: **GitHub-Organisation** oder eigenes Git (Forgejo/TU-GitLab)? | GitHub-Organisation (StuRa oder YETI) | WP-7.1 |
| **E9** | Alte Umami-Cloud-Daten **übernehmen** oder Neustart auf dem Server? | Neustart; letzten Cloud-Report als HTML/PDF archivieren | WP-6.6 |

---

## 3. Phasenübersicht

| Phase | Ziel | Wann | Aufwand (KI-Arbeit, grob) | Läuft auf |
|---|---|---|---|---|
| **1 Notfall** | Sicherheitslücke, kaputter Build, Datenleck, Formular-Bug | **sofort** | 1–2 Tage | Vercel |
| **2 Qualitäts-Netz** | Tests, Validierung im Build, CI, KI-Leitplanken, Doku | bis Mitte Okt. | 2–3 Tage | Vercel |
| **3 Next.js 16 + Node 24** | Next 15 hat am **21.10.2026** Support-Ende | **bis 21.10.** | 1–2 Tage | Vercel |
| **4 Datenpflege reparieren** | dauerhafter Link, Verifizierung bleibt, Sync automatisiert | Okt.–Nov. | 4–6 Tage | Vercel |
| **5 Verschlanken** | Pilot/Studie 2/Demo/altes Quiz entfernen, Rollen, Datenschutz | Nov. | 2–3 Tage | Vercel |
| **6 StuRa-Server** | kompletter Umzug inkl. DB, Statistik, Backups, Monitoring | Dez.–Feb. (weg von Semesterspitzen) | 5–8 Tage + 🧑 Server | StuRa |
| **7 Übergabe** | Accounts, Domain, Impressum, Abschlussdoku | vor Weggang des Teams | 1 Tag + 🧑 | StuRa |

Abhängigkeiten: 1 → 2 → 3 sind strikt nacheinander. 4 und 5 können nach 3 parallel
laufen (verschiedene Dateien), 6 setzt 4 + 5 voraus, 7 setzt 6 voraus.

---

## 4. Die Arbeitspakete

Format pro WP: **Ziel · Warum · Dateien · Schritte · Akzeptanzkriterien · Prüfung ·
Nicht tun · 🧑 danach · Commit-Vorschlag**.

---

### Phase 1 — Notfall (auf Vercel, sofort)

#### WP-1.1 Build der Root-App reparieren
- **Ziel:** `next build` der Root-App läuft wieder durch (seit 30.06.2026 kaputt).
- **Warum:** Ohne funktionierenden Build kann kein Sicherheitsfix deployt werden.
- **Dateien:** `scripts/export-static-site-groups.ts` (Zeile ~117), `tsconfig.json`.
- **Schritte:**
  1. In `scripts/export-static-site-groups.ts` den Typfehler beheben:
     `filterSelections` kommt als Prisma-`JsonValue`. Ersetzen durch eine Typprüfung,
     z. B. `Array.isArray(realRating.filterSelections) ? realRating.filterSelections.filter((x): x is string => typeof x === "string") : []`.
  2. Gleiche Stelle in `static-site/scripts/export-from-backup.mjs` prüfen (dort JS,
     aber dieselbe Robustheit: nur String-Arrays durchlassen).
  3. Kein Ausschluss von `scripts/` aus `tsconfig.json` (Typprüfung der Skripte soll
     bleiben).
- **Akzeptanzkriterien:**
  - [ ] `npx tsc --noEmit` im Root: 0 Fehler.
  - [ ] `npx next build` im Root läuft durch (mit Dummy-Env, siehe Prüfung).
- **Prüfung:**
  ```bash
  npx tsc --noEmit
  DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_URL="$DATABASE_URL" \
    AUTH_SECRET=dummy npx next build
  ```
- **Nicht tun:** `npm run build` mit echter DB ausführen (der läuft heute noch Migrationen).
- **🧑 danach:** Merge → im Vercel-Projekt `fomo` prüfen, dass das Deployment grün ist.
- **Commit:** `fix: make root app build pass again (type-safe filterSelections in exporter)`

#### WP-1.2 Admin-Authentifizierung absichern
- **Ziel:** Kein Admin-Endpunkt ist ohne gültige Anmeldung erreichbar; Rollen werden
  geprüft; deaktivierte Admins verlieren sofort den Zugriff.
- **Warum:** Kritische Lücke (Audit §3b). Details nicht in Commit/PR schreiben (Regel 13).
- **Dateien:**
  - neu: `src/lib/require-admin.ts`
  - `src/lib/auth.ts`
  - alle Handler unter `src/app/api/admin/**` und `src/app/api/pilot/admin-export/route.ts`
    (Liste: `grep -rln "auth()" src/app/api`)
  - alle Seiten unter `src/app/admin/(protected)/**/page.tsx`
  - `package.json` (next-auth)
- **Schritte:**
  1. `next-auth` exakt auf **`5.0.0-beta.32`** pinnen (`npm install next-auth@5.0.0-beta.32 --save-exact`).
  2. `src/lib/require-admin.ts` anlegen mit zwei Helfern:
     - `requireAdminApi(opts?: { role?: "SUPER_ADMIN" })` → gibt entweder
       `{ admin }` zurück oder eine fertige `NextResponse` (401/403).
     - `requireAdminPage(opts?)` → für Server Components, ruft `redirect("/admin/login")`.
     - Beide prüfen: `session?.user?.email` vorhanden **und** Typ korrekt; Admin per
       E-Mail aus der DB laden; `isActive === true`; bei `role`-Option Rolle aus der
       **DB** (nicht aus dem JWT) prüfen.
  3. In **jedem** Admin-API-Handler die bisherige Prüfung (`if (!session)` bzw.
     `if (!session?.user)`) durch `requireAdminApi()` ersetzen. Handler, die heute schon
     eine Rollenprüfung haben (`api/admin/users/**`), behalten `role: "SUPER_ADMIN"`.
  4. In jeder Admin-Seite zusätzlich zur Layout-Prüfung `await requireAdminPage()` am
     Anfang aufrufen (Layouts werden beim partiellen Rendern nicht zuverlässig ausgeführt).
  5. In `src/lib/auth.ts` den `session`-Callback ergänzen: `session.user.id = token.sub`
     (damit der Selbstlösch-Schutz in `api/admin/users/[id]/route.ts` funktioniert).
  6. In `api/admin/users/[id]/route.ts`: verhindern, dass der **letzte aktive
     SUPER_ADMIN** gelöscht, deaktiviert oder herabgestuft wird (409 mit deutscher Meldung).
  7. Logout reparieren: Statt `fetch("/api/auth/signout")` eine Server Action mit
     `signOut({ redirectTo: "/admin/login" })` aus `@/lib/auth` verwenden
     (`src/app/admin/(protected)/layout.tsx`).
  8. Vitest-Tests in `src/lib/__tests__/require-admin.test.ts`: `auth()` gemockt —
     (a) `null` → 401, (b) Objekt **ohne** `user` (z. B. `{ message: "…" }`) → 401,
     (c) User, aber in DB inaktiv → 401, (d) EDITOR bei `role: "SUPER_ADMIN"` → 403,
     (e) aktiver Admin → ok. DB per Mock.
- **Akzeptanzkriterien:**
  - [ ] `grep -rn "if (!session)" src/app` liefert **nichts** mehr.
  - [ ] Alle Admin-Handler und -Seiten nutzen die neuen Helfer.
  - [ ] Tests (a)–(e) grün.
  - [ ] Lokal: Admin-Login, Gruppen bearbeiten, Logout funktionieren.
- **Prüfung:** `npx vitest run src/lib`, `npx tsc --noEmit`, `npx next build` (Dummy-Env), lokaler Smoke-Test mit lokaler DB (`docker compose up -d db`, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`).
- **Nicht tun:** Session-Strategie auf DB umstellen (großer Umbau, später optional).
- **🧑 danach:** Merge → Deploy prüfen → **`AUTH_SECRET`/`NEXTAUTH_SECRET` in Vercel
  rotieren** (alle Sessions werden ungültig, gewollt) → in der Prod-DB prüfen, ob ein
  Admin `admin@fomo.dev` existiert, und ihn ggf. löschen.
- **Commit:** `fix(auth): central admin guard with DB-backed active/role checks`

#### WP-1.3 Next.js-Sicherheitspatch (ohne Major)
- **Ziel:** Beide Apps auf den neuesten Patch der **15.5.x**-Linie (mindestens 15.5.27).
- **Dateien:** `package.json`, `package-lock.json`, `static-site/package.json`, `static-site/package-lock.json`.
- **Schritte:** `npm install next@15.5 eslint-config-next@15.5 --save-exact` im Root;
  `npm install next@15.5 --save-exact` in `static-site/`. Danach `npm audit` beider Apps
  vergleichen und **nur** nicht-brechende Fixes übernehmen (`npm audit fix`, **ohne** `--force`).
- **Akzeptanzkriterien:** [ ] Beide Builds grün · [ ] `npm audit` zeigt für `next` keine
  kritische Lücke mehr · [ ] statische Seite erzeugt weiterhin ~213 Routen.
- **Prüfung:** `cd static-site && npm run build && ls out | wc -l`; Root wie WP-1.1.
- **Commit:** `chore(deps): bump next to latest 15.5 patch in both apps`

#### WP-1.4 Datenleck auf `/groups` der Root-App schließen + ungenutzte öffentliche Endpunkte entfernen
- **Ziel:** Keine internen Felder (Kontaktperson, Aufnahme-Infos, Scraper-Daten) mehr im
  öffentlichen HTML; verworfene öffentliche Schreib-Endpunkte weg.
- **Dateien:** `src/lib/queries/groups.ts`, `src/app/[locale]/(public)/groups/page.tsx`,
  `src/components/groups/GroupCard.tsx`, `src/types/index.ts`,
  `src/app/api/data/groups/route.ts`, `src/app/api/quiz/session/route.ts`,
  `src/app/api/study2/submit/route.ts`, `src/app/api/study2/groups/route.ts`,
  `src/app/[locale]/(fullscreen)/pilot/**`, `src/app/[locale]/(public)/pilot/page.tsx`.
- **Schritte:**
  1. `getActiveGroups()` mit explizitem `select` nur öffentlicher Felder (Name, Slug,
     Kurz-/Langbeschreibung, Kategorie, Website, Instagram, Kontakt-E-Mail, Logo). Einen
     eigenen Typ `PublicGroup` dafür anlegen; `GroupCard` darauf umstellen.
  2. Prüfen, ob andere Server Components ganze Group-Objekte an Client-Komponenten geben
     (`grep -rn "use client"` + Props-Typen) — gleiches Muster anwenden.
  3. Seiten, die diese Endpunkte nutzen, zuerst stilllegen: `/pilot`, `/pilot/quiz`
     (nutzen `api/study2/*`) und das alte Root-Quiz `/quiz` (ruft in
     `src/components/quiz/QuizRouter.tsx` `api/quiz/session` auf) sowie `/demo` per
     Weiterleitung auf `https://www.fomo-dresden.app/quiz/` bzw. `notFound()`
     (vollständiges Entfernen in Phase 5). CTAs auf der Landingpage zu `/pilot`, `/quiz`,
     `/demo` entfernen.
  4. Danach Endpunkte `api/data/groups` (kein Abnehmer), `api/quiz/session`,
     `api/study2/submit`, `api/study2/groups` löschen. Vorher mit
     `grep -rn "<pfad>" src static-site/src` belegen, dass nur noch stillgelegte Seiten sie
     referenzieren, und diese Aufrufe mit entfernen.
- **Akzeptanzkriterien:** [ ] Testwerte in `contactPerson`/`onboardingInfo` einer lokalen
  Gruppe erscheinen **nicht** im HTML von `/groups` (per `curl … | grep`) · [ ] gelöschte
  Endpunkte liefern 404 · [ ] Build grün.
- **Commit:** `fix(privacy): only expose public group fields; remove unused public endpoints`

#### WP-1.5 Bearbeitungsformular: verlorene Änderungen + unklare Fehler
- **Ziel:** Was eine Gruppe ändert, wird gespeichert; Fehler sind verständlich.
- **Dateien:** `src/app/[locale]/(public)/groups/register/GroupSelfRatingQuiz.tsx`,
  `src/app/api/groups/register-attributes/route.ts`, `src/app/api/groups/register/route.ts`,
  `messages/de.json`, `messages/en.json`.
- **Schritte:**
  1. `handleSubmit`-`useCallback`: fehlende Abhängigkeiten ergänzen (`contactEmail`,
     `instagramUrl`, `memberCount`, `foundedYear`, `categoryId`) — oder `useCallback`
     ganz entfernen. ESLint `react-hooks/exhaustive-deps` muss danach still sein.
  2. URL-Normalisierung serverseitig (beide Routen) per Zod-`preprocess`: fehlt das
     Protokoll, `https://` voranstellen; Instagram-Handle (`aiasdresden`, `@x`) →
     `https://www.instagram.com/<handle>/`. Gemeinsame Funktion in `src/lib/normalize-url.ts`
     mit Unit-Tests.
  3. Fehlerantwort 422: Feldnamen auswerten und im Formular **am jeweiligen Feld**
     anzeigen (deutsche Meldungen in `messages/*.json`).
  4. Schaltfläche „Überspringen →" im Fragenschritt in „Weiter (Antwort behalten) →"
     umbenennen, wenn eine Antwort vorausgefüllt ist.
- **Akzeptanzkriterien:** [ ] Lokaler Browser-Test (Playwright, siehe Prüfung): Gruppe
  ändert **nur** Mitgliederzahl + Kontakt-Mail → beide Werte stehen danach in der DB ·
  [ ] `effektiveraltruismus.de` wird als `https://effektiveraltruismus.de` gespeichert ·
  [ ] Unit-Tests für `normalize-url` grün.
- **Prüfung:** neuer E2E-Test `tests/group-edit.spec.ts` (Admin erzeugt Link → Gruppe ändert
  2 Felder → DB-Abfrage über eine Test-Hilfsroute **nur im Testmodus** oder direkt per
  Prisma im Test). `npx playwright test tests/group-edit.spec.ts` gegen lokalen Dev-Server.
- **Commit:** `fix(register): persist all edited fields, normalize URLs, show field errors`

#### WP-1.6 Migrationen aus dem Build nehmen
- **Ziel:** Ein Deploy verändert nie mehr automatisch die Datenbank.
- **Dateien:** `package.json`, `README.md` (Abschnitt Deployment).
- **Schritte:** `"build": "next build"`; neue Skripte `"db:migrate": "prisma migrate deploy"`,
  `"db:status": "prisma migrate status"`. Den `migrate resolve --rolled-back …`-Workaround
  entfernen. README: „Migrationen führt ein Mensch nach einem Backup bewusst aus."
- **Akzeptanzkriterien:** [ ] `npm run build` ruft kein `prisma migrate` mehr auf.
- **🧑 danach:** Vor dem Merge prüfen, dass in Prod **keine** Migration aussteht
  (`npx prisma migrate status` mit Prod-URL, durch eine berechtigte Person).
- **Commit:** `chore(build): stop running prisma migrations during build`

#### WP-1.7 Repo-Hygiene (personenbezogene Daten, Backup-Schutz)
- **Ziel:** Keine personenbezogenen Daten mehr im aktuellen Stand des öffentlichen Repos;
  Backups können nicht versehentlich committet werden.
- **Dateien:** `data/admin-export.json` (löschen), `TODO.md` (persönliche Mailadresse
  entfernen), `.gitignore`, `static-site/.gitignore`, `GroupRegisterForm.tsx` und
  `src/app/[locale]/(fullscreen)/quiz/page.tsx` (persönliche Mailadresse → Funktionsadresse
  `fomo@yeti-dresden.org` bzw. später StuRa-Adresse).
- **Schritte:** Datei löschen; in beiden `.gitignore` ergänzen: `fomo-backup-*.json`,
  `*backup*.json`, `*.dump`, `*.sql.gz`. Hinweis in `TODO.md`, dass die **History** noch
  bereinigt werden muss (E2, nur Owner).
- **Akzeptanzkriterien:** [ ] `git ls-files | grep -i backup` leer · [ ] keine persönlichen
  Mailadressen von Teammitgliedern mehr im Code (`grep -rn "@yeti-dresden.org" src` zeigt
  nur die Funktionsadresse).
- **Nicht tun:** History umschreiben (Regel 5).
- **Commit:** `chore(privacy): remove pilot export from repo, ignore backup files`

#### WP-1.8 🧑 Nur-Mensch-Checkliste Phase 1 (KI erstellt nur die Liste im PR)
- [ ] WP-1.1–1.7 gemergt, Vercel-Deploy der Root-App grün, fomo-pi.vercel.app/admin funktioniert.
- [ ] `AUTH_SECRET`/`NEXTAUTH_SECRET` rotiert; Seed-Admin `admin@fomo.dev` in Prod gelöscht.
- [ ] Umami-API-Key rotiert (war einmal im Klartext geteilt).
- [ ] GitHub-Secret `VERCEL_DEPLOY_HOOK_URL` gesetzt (sonst tut der Montags-Report nichts).
- [ ] In der Admin-App: 7 kaputte URLs + ESG-Website korrigieren (oder nach WP-1.5 einmal
      jede betroffene Gruppe speichern), Duplikate deaktivieren (Rotaract `-2`, kritmed),
      Kategorie-Handkorrekturen (ESG, IG Börse, DIE LINKE.SDS) in der DB nachziehen.
- [ ] Danach **ein** Daten-Sync nach `docs/runbooks/01-gruppe-aendern.md`.
- [ ] E2 entschieden; falls ja: History-Bereinigung durch den Owner.

---

### Phase 2 — Qualitäts-Netz

#### WP-2.1 Test-Setup der Root-App trennen
- **Ziel:** `npm test` testet Unit-Tests, `npm run test:e2e` die Playwright-Specs.
- **Dateien:** neu `vitest.config.ts`, `package.json`.
- **Schritte:** `vitest.config.ts` mit `test.include: ["src/**/*.test.ts"]`,
  `exclude: ["tests/**", "static-site/**", ".claude/**", "node_modules/**"]`.
  Skripte: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`.
- **Akzeptanzkriterien:** [ ] `npm test` grün im sauberen Checkout.
- **Commit:** `test: separate vitest unit tests from playwright e2e specs`

#### WP-2.2 Tests für das Live-Matching (statische Seite)
- **Ziel:** Matching, Share-Links und Gruppenfilter sind durch Tests abgesichert.
- **Dateien:** `static-site/package.json`, neu `static-site/vitest.config.ts`,
  neu `static-site/src/lib/__tests__/matching.test.ts`, `results.test.ts`, `data.test.ts`,
  `static-site/scripts/report.mjs` (minimal refaktorieren, s. u.).
- **Schritte:**
  1. `vitest` als devDependency in `static-site`; Skript `"test": "vitest run"`.
  2. `matching.test.ts`: Filter als harte Bedingung (keine Überschneidung → Score 0);
     neutrale Antworten zählen nicht; Score immer 0–100; Gleichstand deterministisch bei
     gleichem Seed; `topWithTies` liefert 5 + Gleichstände, max. 10.
  3. `results.test.ts`: Encode→Decode-Rundlauf; falsche Länge → `null`.
  4. `data.test.ts`: `getMatchableGroups()` enthält **keine** Gruppe mit
     `selfRating.derived === true`; alle Slugs eindeutig.
  5. Paritätstest Report ↔ Live-Matching: In `report.mjs` die Matching-Kopie als
     benannte Funktion exportieren und den Hauptteil hinter
     `if (import.meta.url === pathToFileURL(process.argv[1]).href)` legen. Test: 1.000
     zufällige Profile (fester Seed) → Ranking aus `report.mjs` == Ranking aus `matching.ts`.
- **Akzeptanzkriterien:** [ ] `cd static-site && npm test` grün · [ ] `npm run build` weiterhin grün.
- **Commit:** `test(static-site): cover matching, share links, matchable-group filter, report parity`

#### WP-2.3 Datenprüfung als Pflicht vor jedem Build
- **Ziel:** Kaputte Daten können nicht mehr live gehen.
- **Dateien:** `static-site/scripts/validate-data.mjs`, `static-site/package.json`,
  `static-site/src/lib/categories.ts`.
- **Schritte:**
  1. `validate-data.mjs` erweitern: `websiteUrl`/`instagramUrl` müssen mit `http://` oder
     `https://` beginnen und als `new URL()` parsebar sein (**Fehler** bei verifizierten
     Gruppen, **Warnung** bei unbestätigten); `categoryName` muss in einer zentralen Liste
     bekannter Kategorien stehen (Fehler).
  2. Fehlende `categoryColor` nicht mehr warnen, sondern in `categories.ts` eine
     Farbtabelle pro Kategorie als Fallback pflegen und im UI nutzen.
  3. `prebuild` ändern zu: `node scripts/validate-data.mjs && node scripts/report.mjs --out public/report/index.html`.
  4. Exit-Code ≠ 0 bei Fehlern (ist bereits so), Ausgabe kurz und deutsch-freundlich.
- **Akzeptanzkriterien:** [ ] In einer Kopie der Daten mit (a) Wert `2`, (b) doppeltem Slug,
  (c) Filter `sport`, (d) URL ohne Protokoll bei verifizierter Gruppe **bricht `npm run build` ab**
  · [ ] mit den echten (nach WP-1.8 bereinigten) Daten läuft der Build durch.
- **Hinweis:** Falls die echten Daten die URL-Prüfung noch nicht bestehen (WP-1.8 noch offen),
  URL-Prüfung vorübergehend als Warnung lassen und in `TODO.md` vermerken.
- **Commit:** `feat(static-site): enforce data validation before every build`

#### WP-2.4 CI auf jedem Pull Request
- **Ziel:** Jeder PR wird automatisch gebaut und getestet.
- **Dateien:** neu `.github/workflows/ci.yml`, neu `.nvmrc` (`24`).
- **Schritte:** Zwei Jobs, beide mit `actions/setup-node` und `node-version-file: .nvmrc`:
  - `static-site`: `npm ci` → `node scripts/validate-data.mjs` → `npx tsc --noEmit` →
    `npm test` → `npm run build`.
  - `root`: `npm ci` → `npx prisma generate` → `npx tsc --noEmit` → `npx eslint src scripts prisma tests` →
    `npm test` → `npx next build` (Dummy-Env wie WP-1.1).
  - Trigger: `pull_request` und `push` auf `main`. Keine Secrets nötig.
- **Akzeptanzkriterien:** [ ] Workflow läuft im PR dieses WPs grün.
- **🧑 danach:** WP-2.7.
- **Commit:** `ci: build, typecheck, lint and test both apps on every PR`

#### WP-2.5 KI-Leitplanken technisch erzwingen
- **Ziel:** Claude Code kann gefährliche Dinge gar nicht erst tun.
- **Dateien:** neu `.claude/settings.json`, neu `.claude/hooks/guard-bash.sh`,
  neu `.claude/hooks/guard-files.sh`, `.gitignore` (`.claude/worktrees/`, `.claude/settings.local.json`).
- **Schritte:**
  1. **Vorher** das aktuelle Format in der Claude-Code-Doku prüfen (Settings, Hooks).
  2. `permissions.deny`: `Read(./.env)`, `Read(./.env.*)`, `Read(./**/.env*)`,
     `Read(./**/fomo-backup-*.json)`, `Bash(npx prisma migrate deploy:*)`,
     `Bash(npx prisma migrate reset:*)`, `Bash(npx prisma db push:*)`,
     `Bash(npm run import:groups:*)`, `Bash(git push --force:*)`, `Bash(git push origin main:*)`.
  3. `PreToolUse`-Hooks (Exit-Code 2 = blockieren, Begründung auf stderr):
     - `guard-files.sh` (Matcher `Edit|Write|MultiEdit`): blockiert Schreiben auf
       `static-site/data/groups.json` mit der Meldung „groups.json wird aus der DB erzeugt —
       Änderung über die Admin-App, siehe docs/runbooks/01-gruppe-aendern.md".
     - `guard-bash.sh` (Matcher `Bash`): blockiert Befehle mit `DATABASE_URL=postgres` auf
       nicht-lokale Hosts und `git push` ohne Branch-Angabe auf `main`.
  4. Kurze Erklärung in `CLAUDE.md` (Abschnitt „Leitplanken").
- **Akzeptanzkriterien:** [ ] Hooks sind ausführbar (`chmod +x`) und mit Beispiel-JSON
  auf stdin getestet (Testbefehle im PR dokumentiert).
- **Commit:** `chore(ai): add Claude Code permission rules and guard hooks`

#### WP-2.6 Doku auf den echten Stand bringen
- **Ziel:** Keine widersprüchliche Doku mehr; neue Personen/KIs landen richtig.
- **Dateien:** `CLAUDE.md` (Inhalt aus `docs/uebergabe/CLAUDE.md.entwurf`, Fakten auf den
  Stand nach Phase 1 bringen), neu `AGENTS.md` (verweist auf `CLAUDE.md`), `README.md`,
  `TODO.md`, `static-site/README.md`, `static-site/docs/BETRIEBSHANDBUCH.md`,
  `static-site/docs/KI-MITARBEIT.md`; `docs/uebergabe/runbooks/*` → nach `docs/runbooks/`
  verschieben.
- **Konkret korrigieren (mindestens):** 17 Attribute → 21 Items + 8 Filter; `APP_MODE` →
  gibt es nicht; Matching-Formel → aktuelle Methode; Zahlen 95/51/44 (bzw. aktuelle);
  „Vercel prüft Daten beim Build" → stimmt erst nach WP-2.3; README-Setup-Pfad `cd Fomo`;
  Betriebshandbuch „0 €, keine DB, keine Updates" → die Registrierungs-App braucht Pflege;
  Branch-Regel einheitlich „immer PR"; Toggle „unbestätigte Gruppen" ist standardmäßig an.
- **Akzeptanzkriterien:** [ ] Ein frischer Leser findet über `CLAUDE.md` in ≤ 2 Klicks das
  passende Runbook für jede der 12 Aufgaben aus Audit §4.
- **Commit:** `docs: align CLAUDE.md, README and ops docs with the actual system`

#### WP-2.7 🧑 Branch-Schutz einschalten
- [ ] GitHub → Settings → Branches → Regel für `main`: PR erforderlich, CI-Checks
  `static-site` + `root` erforderlich, gilt auch für Admins, kein Force-Push.

---

### Phase 3 — Next.js 16 + Node 24 (Frist: 21.10.2026)

#### WP-3.1 Statische Seite auf Next.js 16
- **Dateien:** `static-site/package.json`, `static-site/next.config.ts`, neu `static-site/eslint.config.mjs`.
- **Schritte:**
  1. `npx @next/codemod@latest upgrade` in `static-site/` (Next 16, React passend).
  2. `eslint`-Key aus `next.config.ts` entfernen; `next lint` per Codemod
     `npx @next/codemod@latest next-lint-to-eslint-cli .` auf ESLint-CLI umstellen;
     eigene flache ESLint-Config; die 4 `react/no-unescaped-entities`-Fehler beheben.
  3. `output: "export"`, `trailingSlash`, `images.unoptimized` bleiben.
- **Akzeptanzkriterien:** [ ] Build grün, gleiche Routenanzahl wie vorher (±0) ·
  [ ] Tests grün · [ ] `npm run lint` grün · [ ] Stichprobe im Browser (375 px):
  Startseite, Quiz komplett, Ergebnis, Gruppen-Detail, `/en/`.
- **Commit:** `chore(static-site): upgrade to Next.js 16`

#### WP-3.2 Root-App auf Next.js 16
- **Dateien:** `package.json`, `next.config.ts`, `src/middleware.ts` → `src/proxy.ts`,
  `eslint.config.mjs`, betroffene Seiten (async `params`/`cookies`/`headers`).
- **Schritte:** Codemod-Upgrade; `middleware.ts` → `proxy.ts` (next-intl), Matcher
  unverändert; ESLint-CLI; next-auth-Beta auf Kompatibilität prüfen (Login, Session, Logout).
- **Akzeptanzkriterien:** [ ] Build + Unit-Tests grün · [ ] lokaler Smoke-Test: Login,
  Gruppe bearbeiten, Link erzeugen, Selbstregistrierung, Bearbeitungsformular, `/en/…`.
- **Commit:** `chore: upgrade root app to Next.js 16 (middleware → proxy)`

#### WP-3.3 Node 24 überall festnageln
- **Dateien:** `.nvmrc`, `package.json` + `static-site/package.json` (`"engines": { "node": ">=24 <25" }`),
  `static-site/Dockerfile`, `.github/workflows/*.yml`.
- **🧑 danach:** In beiden Vercel-Projekten Node-Version auf 24 stellen.
- **Commit:** `chore: pin Node.js 24 LTS across apps, CI and Docker`

---

### Phase 4 — Datenpflege reparieren

#### WP-4.1 Verifizierung bleibt bei Korrekturen + Änderungsprotokoll (wartet auf E1)
- **Ziel:** Eine verifizierte Gruppe fällt nach einer Korrektur **nicht** mehr aus dem Quiz;
  Admins sehen, was sich geändert hat, und können es zurücknehmen.
- **Dateien:** `prisma/schema.prisma` (neues Modell), neue Migration,
  `src/app/api/groups/register-attributes/route.ts`, neu `src/lib/change-log.ts`,
  neue Admin-Seite `src/app/admin/(protected)/aenderungen/page.tsx`, Admin-Navigation.
- **Schritte:**
  1. Modell `GroupChangeLog { id, groupId, source ("edit-link"|"admin"), changes Json /* {feld: {from, to}} */, createdAt, reviewedAt?, reviewedByEmail? }`.
  2. Beim Absenden über einen Link: Vorher-/Nachher-Diff aller Felder + Antworten +
     Filter berechnen und speichern. `isVerified` **nur dann** auf `false` setzen, wenn die
     Gruppe vorher nicht verifiziert war. `registrationStatus` bleibt `VERIFIED`, wenn sie
     es war.
  3. Admin-Seite „Änderungen": Liste ungesehener Änderungen mit Diff, Knöpfe „Gesehen"
     und „Rückgängig" (setzt die alten Werte zurück, protokolliert das ebenfalls).
  4. Auch Admin-Änderungen über `api/admin/groups/[id]` protokollieren (`source: "admin"`).
- **Akzeptanzkriterien:** [ ] Test: verifizierte Gruppe reicht Änderung ein → bleibt
  verifiziert, Export liefert `derived: false` mit neuen Antworten · [ ] „Rückgängig"
  stellt den alten Stand her · [ ] Migration lokal angewendet und wieder zurücksetzbar.
- **🧑 danach:** Migration in Prod nach Backup ausführen (`npm run db:migrate`).
- **Commit:** `feat(groups): keep verification on edits and add admin change log`

#### WP-4.2 Dauerhafter Bearbeitungslink pro Gruppe
- **Ziel:** Jede Gruppe hat einen wiederverwendbaren Link; „Link verloren" löst der Admin
  mit einem Klick, ohne dass alte Einmal-Links ausgegeben werden.
- **Dateien:** `prisma/schema.prisma`, Migration, neu `src/lib/edit-token.ts`,
  neue Route `src/app/[locale]/(public)/gruppe/bearbeiten/page.tsx` (nutzt das bestehende
  Formular `GroupSelfRatingQuiz.tsx` im Modus „edit"), `src/app/api/groups/register-attributes/route.ts`
  (oder neue Route `api/groups/edit`), Admin-Gruppenseite.
- **Schritte:**
  1. Modell `GroupEditToken { id, groupId, tokenHash @unique, createdAt, lastUsedAt?, revokedAt?, expiresAt }`.
     Token = `crypto.randomBytes(32).toString("base64url")`, gespeichert wird nur
     `sha256(token)`. Gültigkeit 12 Monate, **mehrfach nutzbar**.
  2. Admin: Knopf „Bearbeitungslink erzeugen" → zeigt den Link **einmal** mit
     „Kopieren" und einem vorbereiteten `mailto:` an die hinterlegte Adresse (Mustertext
     aus `docs/runbooks/03-link-verloren.md`). Option „alle alten Links dieser Gruppe
     widerrufen".
  3. Bestehende `GroupInvite`-Links funktionieren weiter (Übergang), neue werden nur noch
     als Edit-Token erzeugt. Bulk-Button „Einladungen generieren" auf Edit-Tokens umstellen
     (und dabei den Status-Vergleich `"invited"` → Enum-Wert korrigieren).
  4. Formular im Edit-Modus: immer vorausgefüllt; Knopf „Nur Gruppeninfos ändern" springt
     direkt zum Infoschritt (Fragen bleiben unverändert).
- **Akzeptanzkriterien:** [ ] Ein Link funktioniert für 2 aufeinanderfolgende Änderungen ·
  [ ] widerrufener Link → verständliche Fehlerseite mit Kontaktadresse · [ ] Tests für
  Token-Erzeugung/Prüfung/Widerruf · [ ] DB enthält keine Klartext-Tokens.
- **Commit:** `feat(groups): reusable, revocable edit links per group`

#### WP-4.3 „Link anfordern" per Mail (wartet auf E3)
- **Ziel:** Gruppen holen sich ihren Link selbst, ohne Admin.
- **Dateien:** neue Seite `src/app/[locale]/(public)/gruppe/link-anfordern/page.tsx`,
  neue Route `src/app/api/groups/request-link/route.ts`, neu `src/lib/mail.ts`
  (`nodemailer`), `.env.example` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`).
- **Schritte:**
  1. Formular: Gruppenname (Auswahl aus aktiven Gruppen).
  2. Server: erzeugt einen **neuen** Edit-Token (alte bleiben gültig, max. 5 aktive pro
     Gruppe, älteste werden widerrufen) und schickt ihn **nur** an `Group.contactEmail`
     bzw. verantwortliche `GroupContact`-Adressen.
  3. Antwort **immer gleich** („Wenn für diese Gruppe eine Adresse hinterlegt ist, haben
     wir einen Link geschickt.").
  4. Rate-Limit **in der DB** (nicht im Speicher): max. 1 Anfrage pro Gruppe pro Stunde,
     max. 10 pro IP pro Tag.
  5. Ohne SMTP-Konfiguration: Seite zeigt „Bitte schreibt an <Kontaktadresse>".
  6. Link „Link verloren?" auf Fehlerseiten des Formulars und auf der statischen Seite
     (`static-site/src/components/UnverifiedNotice.tsx`, Footer).
- **Akzeptanzkriterien:** [ ] Test mit lokalem SMTP-Fake (z. B. MailHog/Mailpit-Container):
  Mail kommt nur an hinterlegte Adresse · [ ] Antworttext identisch für bekannte und
  unbekannte Gruppen · [ ] Rate-Limit greift.
- **Commit:** `feat(groups): self-service edit-link request via email`

#### WP-4.4 Formular und Admin-Oberfläche entrümpeln
- **Dateien:** `GroupSelfRatingQuiz.tsx`, `src/app/admin/(protected)/groups/**`,
  `src/app/api/admin/groups/**`.
- **Schritte:**
  1. Gruppen können die **lange Beschreibung** bearbeiten; Felder lassen sich **leeren**
     (Client sendet `null`, Server akzeptiert `null` als „löschen").
  2. Abschlussseite: erklärt, wann die Änderung live ist, und verlinkt auf
     www.fomo-dresden.app (nicht auf `/groups` der Root-App).
  3. Admin kann **Filter (`filterSelections`)** und Antworten einer Gruppe bearbeiten
     (mit Protokoll aus WP-4.1).
  4. Spalte „x / 17" in der Admin-Liste ersetzen durch „Profil: echt/abgeleitet ·
     verifiziert ja/nein".
  5. Knöpfe „CSV neu importieren" und „Scraper-JSON" **entfernen** (inkl. API-Routen
     `api/admin/import-groups`, `api/admin/groups/scraper-import`).
  6. Merge: übernimmt Kontakte (`GroupContact` umhängen statt löschen) und Kategorie.
  7. Slug im Admin nur mit Warnung änderbar („bricht Logo-Zuordnung, Übersetzung und
     geteilte Links").
- **Commit:** `feat(admin): editable filters/answers, safe merge, remove destructive imports`

#### WP-4.5 Daten-Sync automatisieren (Übergangslösung auf Vercel)
- **Ziel:** Kein Backup-Download und kein Terminal mehr, um Daten live zu bringen.
- **Dateien:** neu `src/lib/export/static-groups.ts` (gemeinsame Export-Logik, aus
  `scripts/export-static-site-groups.ts` herausgezogen), Skript nutzt die Lib, neue Route
  `src/app/api/admin/export/static-groups/route.ts`, neu `.github/workflows/sync-groups.yml`.
- **Schritte:**
  1. Export-Logik in die Lib verschieben (URL-Normalisierung aus WP-1.5 inklusive), ein
     Unit-Test vergleicht das Ergebnis für ein Fixture mit dem bisherigen Skript.
  2. Route: liefert **nur** das PII-freie `groups.json`-Format. Zugriff entweder als Admin
     (`requireAdminApi`) oder mit `Authorization: Bearer <EXPORT_TOKEN>` (Vergleich mit
     `crypto.timingSafeEqual`).
  3. Workflow `sync-groups.yml` (`workflow_dispatch`): holt die Route mit dem Secret
     `EXPORT_TOKEN`, schreibt `static-site/data/groups.json`, führt `validate-data.mjs` aus,
     öffnet einen PR „Daten-Sync <Datum>" mit der Diff-Zusammenfassung (geänderte Gruppen).
  4. Admin-Dashboard: Hinweis + Link „Website aktualisieren → GitHub Actions → Run workflow".
  5. `export-from-backup.mjs` als Notfallweg behalten, im Runbook so markieren.
- **Akzeptanzkriterien:** [ ] Workflow lokal mit `act` oder im PR mit Fake-Endpunkt
  getestet · [ ] Route ohne Auth → 401 · [ ] Route liefert keine Felder außerhalb des
  `Group`-Typs der statischen Seite.
- **🧑 danach:** Secret `EXPORT_TOKEN` in Vercel + GitHub anlegen; erster Sync-PR prüfen.
- **Commit:** `feat(sync): export groups via protected endpoint and sync workflow`

#### WP-4.6 Kategorien und Übersetzungen vereinheitlichen
- **Dateien:** `static-site/src/lib/categories.ts`, `static-site/src/lib/group-copy.ts`,
  `static-site/src/components/GroupBrowser.tsx`, `static-site/src/lib/group-translations.ts`,
  `static-site/scripts/validate-data.mjs`.
- **Schritte:**
  1. **Eine** Kategorienliste (Name DE, Name EN, Farbe, Icon, SEO-Text) in `categories.ts`
     für alle 11 Kategorien; doppelte EN-Liste in `GroupBrowser.tsx` entfernen; SEO-Seiten
     auch für „Musik" und „Glaube & Spiritualität".
  2. Wort-für-Wort-„Übersetzer" in `group-copy.ts` entfernen: Ohne EN-Text die deutsche
     Beschreibung mit Hinweis „(nur auf Deutsch verfügbar)" zeigen.
  3. Jeder Eintrag in `group-translations.ts` bekommt `sourceHash` (Hash der deutschen
     Beschreibung). `validate-data.mjs` **warnt**, wenn der Hash nicht mehr passt
     („Übersetzung veraltet").
  4. Verwaiste Einträge (z. B. `tu-dresden-robotik-ag-turag`) entfernen.
- **Commit:** `refactor(static-site): single category source, honest EN fallback, stale-translation check`

#### WP-4.7 Eine Quelle für die Quiz-Items
- **Ziel:** Gruppen und Studis sehen garantiert dieselben Fragen.
- **Dateien:** `src/lib/study2/items.ts` → umbenennen zu `src/lib/ws2-items.ts`,
  `data/working-set-v2.json`, neu `scripts/check-items-sync.mjs`, `.github/workflows/ci.yml`.
- **Schritte:** Umbenennen + Importe anpassen. `check-items-sync.mjs` vergleicht IDs,
  Texte, Reihenfolge, Filter zwischen `data/working-set-v2.json` und
  `static-site/data/quiz.json`; Abweichung → Exit 1. In CI aufnehmen.
- **Commit:** `chore: rename WS2 item module and enforce item-set sync in CI`

---

### Phase 5 — Verschlanken

#### WP-5.1 🧑 Archiv vor dem Löschen
- [ ] Vollständiges Backup der Prod-DB ziehen und **außerhalb des Repos** im StuRa-Speicher
  ablegen (Pilot- und Studie-2-Daten), mit Löschfrist dokumentieren.
- [ ] Freigabe an die KI: „Pilot/Studie 2/Demo/altes Quiz dürfen entfernt werden."

#### WP-5.2 Altlasten-Code entfernen
- **Ziel:** ~60 % weniger Code in `src/`, nur noch Registrierung, Bearbeitung, Admin.
- **Entfernen (vorher per `grep` jeden Import prüfen):**
  - Pilot: `src/app/admin/(protected)/pilot/**`, `src/app/api/admin/pilot/**`,
    `src/app/api/pilot/**`, `src/lib/pilot-*.ts`, `src/lib/queries/pilot.ts`,
    `src/types/pilot-statistics.ts`, `src/lib/dimension-priming.ts`,
    `src/components/survey/**`, `src/components/variants/**`, `src/lib/group-survey-questions.ts`.
  - Studie 2: `src/app/[locale]/(fullscreen)/pilot/**`, `src/app/[locale]/(public)/pilot/**`,
    `src/app/admin/(protected)/study2/**`, `src/app/api/admin/study2/**`.
  - Demo: `src/components/demo/**`, `src/app/[locale]/(fullscreen)/demo/**`.
  - Altes Quiz: `src/app/[locale]/(fullscreen)/quiz/**`, `src/components/quiz/**`,
    `src/lib/quiz/**`, `src/lib/queries/quiz.ts`, `src/app/admin/(protected)/quiz/**`,
    `src/app/api/admin/quiz/**`.
  - CMS/Sonstiges: `src/lib/queries/site-config.ts`, `src/lib/analytics.ts` (falls ungenutzt),
    `src/app/[locale]/(public)/groups/register/AttributeChecklist.tsx`, öffentliches `/groups`
    der Root-App (die statische Seite hat das Verzeichnis; Weiterleitung dorthin).
  - Skripte: `scripts/export-pilot-data.ts`, `scripts/import-working-set.ts`,
    `scripts/import-scraper-results.ts`, `scripts/export-static-data.ts`,
    `scripts/migrate-categories.ts`, `scripts/reset-unverified-categories.ts`,
    `scripts/validation/**`, `scripts/import-groups.ts` (+ `npm run import:groups`).
  - Tests: `tests/pilot-survey.spec.ts`, `tests/variant-switch.spec.ts`,
    `tests/study2-integration.spec.ts`, `src/lib/quiz/__tests__/**`.
  - Ungenutzte Abhängigkeiten nach `npx depcheck` (u. a. `radix-ui`,
    `class-variance-authority`, `lucide-react`, `papaparse`, `shadcn` — jeweils prüfen).
  - Nicht mehr genutzte Schlüssel in `messages/*.json`.
- **Landingpage der Root-App** ersetzen durch eine schlichte Seite: „Gruppe registrieren",
  „Profil bearbeiten / Link anfordern", „Zur FOMO-Website". `APP_LIVE` entfernen.
- **Akzeptanzkriterien:** [ ] Build, Tests, E2E (`admin`, `api-validation`, `responsive`,
  `group-edit`) grün · [ ] `wc -l` von `src/` vorher/nachher im PR.
- **Commit:** `refactor: remove pilot, study 2, demo and legacy quiz from the root app`

#### WP-5.3 Datenbank verschlanken
- **Dateien:** `prisma/schema.prisma`, neue Migration.
- **Schritte:** Modelle entfernen: `GroupPilotAnswer`, `SiteConfig`, `QuizSession`,
  `QuizThesis`, `QuizThesisAttribute`, `PilotDimension`, `PilotSurveyQuestion`,
  `PilotSession`, `PilotAnswer`, `Study2Session`, `Study2Answer`; Felder
  `scraperAttributes`, `confirmedAttributes`. **Die 17 Binär-Spalten bleiben** (werden für
  abgeleitete Profile unbestätigter Gruppen gebraucht). Backup-Route
  `api/admin/backup` anpassen. Seed anpassen.
- **Akzeptanzkriterien:** [ ] Migration lokal auf einer Kopie des Schemas mit Testdaten
  erfolgreich · [ ] Build + Tests grün.
- **🧑 danach:** Nach WP-5.1-Backup Migration in Prod ausführen.
- **Commit:** `refactor(db): drop pilot, study 2 and legacy quiz tables`

#### WP-5.4 Rollen und Login härten
- **Schritte:** SUPER_ADMIN exklusiv für: Backup, Löschen, Merge, Admin-Verwaltung.
  EDITOR: bearbeiten, verifizieren, Links erzeugen. Login-Rate-Limit in der DB
  (z. B. 5 Fehlversuche pro E-Mail in 15 Min → Sperre 15 Min). Login-Antwortzeit für
  unbekannte E-Mails angleichen (Dummy-bcrypt-Vergleich). E-Mail beim Login klein schreiben.
- **Commit:** `feat(auth): role separation and DB-backed login rate limit`

#### WP-5.5 Löschkonzept umsetzen
- **Schritte:** Admin kann einzelne Kontakte löschen; abgelaufene/widerrufene Tokens
  und alte Einladungen werden per Aufgabe gelöscht (Skript `scripts/cleanup.ts`, später
  als Cron auf dem Server); Aufbewahrungsfristen in `docs/datenschutz-loeschkonzept.md`
  (Inhalt 🧑 mit StuRa abstimmen).
- **Commit:** `feat(privacy): contact deletion and token cleanup`

#### WP-5.6 Impressum, Datenschutz, Einwilligung der Root-App (Texte 🧑)
- **Schritte:** Seiten `/impressum` und `/datenschutz` in der Root-App (Inhalt analog zur
  statischen Seite, verantwortliche Stelle laut 🧑), Footer-Links, Einwilligungstext im
  Registrierungsformular mit Link auf die Datenschutzerklärung. Platzhalter-Kommentar in
  `static-site/src/app/datenschutz/page.tsx` entfernen, Umami korrekt beschreiben (bis
  Phase 6: Umami Cloud als Anbieter). E7 berücksichtigen.
- **Commit:** `feat(legal): imprint and privacy pages for the registration app`

---

### Phase 6 — Umzug auf den StuRa-Server

> Vorbedingung: Phasen 1–5 abgeschlossen, WP-6.0 geklärt. Zielbild:
> `docs/uebergabe/recherche-umsetzung.md` §3.

#### WP-6.0 🧑 Klärung mit dem Referat Technik
- [ ] Fragenliste aus `recherche-umsetzung.md` §7 beantwortet.
- [ ] Entscheidungen E3, E4, E5, E6, E9 getroffen.
- [ ] Server bereitgestellt (Linux, Docker + Compose-Plugin), SSH-Zugang für 1–2
      verantwortliche Personen, DNS-Zugriff geklärt.

#### WP-6.1 Registrierungs-App als Container
- **Dateien:** `next.config.ts` (`output: "standalone"`), neu `Dockerfile` (Root),
  neu `.dockerignore`, neu `src/app/api/health/route.ts`.
- **Schritte:**
  1. Multi-Stage-Build auf `node:24-alpine`: `deps` → `build` (`npx prisma generate`,
     `npm run build`) → `runner` (nur `.next/standalone`, **zusätzlich `.next/static` und
     `public/` kopieren**, Prisma-Engine/Client mitnehmen), Nicht-root-User, `EXPOSE 3000`.
  2. `/api/health`: prüft DB-Verbindung (`SELECT 1`), liefert JSON `{ ok, db, version }`.
  3. Env für Self-Hosting dokumentieren: `AUTH_TRUST_HOST=true`, `AUTH_URL`, `AUTH_SECRET`,
     `DATABASE_URL`, SMTP-Variablen.
- **Akzeptanzkriterien:** [ ] `docker build .` lokal erfolgreich · [ ] Container startet
  gegen lokale Postgres, Login/Bearbeiten funktionieren · [ ] Image < 300 MB.
- **Commit:** `feat(deploy): standalone Docker image for the registration app`

#### WP-6.2 Server-Stack `deploy/` (wartet auf E4, E5, E6)
- **Dateien (neu):** `deploy/docker-compose.yml`, `deploy/.env.example`,
  `deploy/Caddyfile`, `deploy/README.md`.
- **Dienste:**
  - `caddy` (Compose-Profil `proxy`, abschaltbar wenn der StuRa einen eigenen Proxy hat):
    - `www.fomo-dresden.app` → `file_server` aus `/srv/fomo/current`, eigene 404-Seite,
      Security-Header (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy),
      lange Cache-Zeiten nur für `/_next/static/*`.
    - `fomo-dresden.app` → 301 auf `www`.
    - `verwaltung.fomo-dresden.app` → `app:3000`; zusätzlich `basic_auth` auf `/admin*` und
      `/api/admin*` (Zugangsdaten aus Env, E6).
    - `statistik.fomo-dresden.app` → `umami:3000`.
  - `app` (Image aus WP-6.1), `postgres:16` (Volume, Datenbanken `fomo` und `umami`),
    `umami` (offizielles Image), `backup` (WP-6.5), `webhook` (WP-6.4),
    `uptime-kuma` (Profil `monitoring`).
  - Alle Dienste mit `restart: unless-stopped`, Healthchecks, nur Caddy veröffentlicht
    Ports (80/443).
- **Akzeptanzkriterien:** [ ] `docker compose --profile proxy up -d` startet lokal mit
  Test-Domains (z. B. `*.localhost`) · [ ] Admin-Pfade verlangen Basic-Auth **und** App-Login.
- **Commit:** `feat(deploy): docker compose stack for the StuRa server`

#### WP-6.3 Statische Seite auf dem Server bauen und atomar ausrollen
- **Dateien:** neu `deploy/scripts/build-static.sh` (ersetzt/übernimmt
  `static-site/scripts/update-data.sh`), neu `scripts/export-groups-from-db.ts`
  (nutzt die Lib aus WP-4.5).
- **Ablauf:**
  1. Repo-Stand von `main` in ein Arbeitsverzeichnis holen.
  2. `groups.json` **direkt aus der DB** exportieren (Container im selben Netz, `DATABASE_URL`).
  3. `validate-data.mjs` → bei Fehler **abbrechen, alter Stand bleibt live**.
  4. `npm ci && npm run build` in einem `node:24`-Container (Umami-Env für Report).
  5. `out/` nach `/srv/fomo/releases/<zeitstempel>` kopieren, Symlink
     `/srv/fomo/current` atomar umstellen (`ln -sfn` auf temporären Link + `mv -T`),
     letzte 10 Releases behalten.
  6. Log nach `/srv/fomo/logs/build-<zeitstempel>.log`, Status-Datei
     `/srv/fomo/last-build.json` (Zeit, Commit, Ergebnis, Gruppenanzahl).
  7. Rollback-Befehl `deploy/scripts/rollback-static.sh` (vorheriges Release).
- **Bekannte Mängel des alten Skripts beheben:** bei fehlgeschlagener Validierung alten
  Stand wiederherstellen; leeres `UMAMI_SRC` → Standardwert; Doku der Variablen
  `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_REGISTER_URL`.
- **Akzeptanzkriterien:** [ ] Lokal mit dem Compose-Stack: Build läuft, Seite unter
  `www.localhost` erreichbar · [ ] absichtlich kaputte Daten → alter Stand bleibt.
- **Commit:** `feat(deploy): server-side static build with validation and atomic switch`

#### WP-6.4 „Website aktualisieren" und Deploy per Webhook
- **Dateien:** `deploy/webhook/hooks.json`, `deploy/scripts/deploy.sh`, Admin-Dashboard.
- **Schritte:**
  1. `webhook` (adnanh/webhook) mit zwei Hooks, beide per HMAC-Secret geschützt:
     - `build-static` → `build-static.sh` (nur Daten/Seite neu bauen).
     - `deploy` → `deploy.sh`: `git pull` → **DB-Backup** → App-Image neu bauen →
       `prisma migrate deploy` → App neu starten → `build-static.sh`.
  2. GitHub-Webhook auf `deploy` für Push auf `main` (🧑 einrichten).
  3. Admin-Dashboard: Knopf **„Website aktualisieren"** ruft intern `build-static` auf
     (Server-zu-Server im Docker-Netz) und zeigt Zeitpunkt + Ergebnis des letzten Builds
     aus `last-build.json`. Nur ein Build gleichzeitig (Lock-Datei).
  4. Wöchentlicher Report-Neubau per Cron/`systemd`-Timer auf dem Server (ersetzt den
     GitHub-Schedule, der nach 60 Tagen Inaktivität abschaltet).
- **Akzeptanzkriterien:** [ ] Knopf → nach ~1–2 Min neue Daten live (lokal getestet) ·
  [ ] Webhook ohne gültige Signatur → abgelehnt.
- **Commit:** `feat(deploy): one-click publish and signed deploy webhook`

#### WP-6.5 Backups mit getestetem Restore
- **Dateien:** `deploy/backup/backup.sh`, `deploy/backup/restore.sh`, Compose-Dienst `backup`.
- **Schritte:** `pg_dump -Fc` beider Datenbanken täglich 03:00; Rotation 7 täglich /
  4 wöchentlich / 6 monatlich; Kopie an externes Ziel (Variable `BACKUP_REMOTE`, z. B.
  per `rclone` auf StuRa-Nextcloud — 🧑 Ziel festlegen); `restore.sh <datei>` stellt in
  eine **separate** Test-DB wieder her und zählt Gruppen.
- **Akzeptanzkriterien:** [ ] Backup → Restore in Test-DB → Gruppenanzahl stimmt (lokal) ·
  [ ] halbjährlicher Restore-Test im Wartungskalender (Betriebshandbuch).
- **Commit:** `feat(deploy): daily postgres backups with rotation and restore script`

#### WP-6.6 Statistik selbst hosten
- **Schritte:** Umami-Dienst einrichten; in der statischen Seite `UMAMI_SRC` auf
  `https://statistik.fomo-dresden.app/script.js` und neue `UMAMI_WEBSITE_ID`; `report.mjs`
  im Self-Hosted-Modus (`UMAMI_URL`, `UMAMI_USER`, `UMAMI_PASSWORD`); Datenschutzerklärung
  anpassen (kein Drittanbieter mehr). 🧑 E9: letzten Cloud-Report archivieren.
- **Commit:** `feat(analytics): switch to self-hosted Umami`

#### WP-6.7 Logos hochladen
- **Schritte:** Upload im Bearbeitungsformular und im Admin: nur PNG/JPEG/WebP (kein SVG
  wegen Skript-Risiko), max. 1 MB, serverseitig neu kodieren/verkleinern (`sharp`),
  Ablage im Volume `/data/uploads/logos/<slug>-<hash>.webp`; Export setzt `logoUrl`;
  `build-static.sh` kopiert Logos in den Build. Einmal-Skript übernimmt die 13
  vorhandenen Logos aus `static-site/public/group-logos/` in die DB. `logos.json` bleibt
  als Fallback, bis alle migriert sind.
- **Commit:** `feat(groups): logo upload with server-side re-encoding`

#### WP-6.8 Monitoring
- **Schritte:** Uptime Kuma: Checks für `www`, `verwaltung` (`/api/health`), `statistik`,
  Zertifikats-Ablauf, „letzter erfolgreicher Build jünger als 8 Tage"; Benachrichtigung per
  Mail (SMTP aus E3). 🧑 zusätzlich externen Gratis-Check auf `www` einrichten.
- **Commit:** `feat(deploy): uptime monitoring configuration`

#### WP-6.9 🧑 Datenbank-Umzug (KI schreibt das Runbook `docs/runbooks/db-umzug.md`)
- Wartungshinweis in der Admin-App aktivieren (Schreibzugriffe pausieren) → `pg_dump`
  der Vercel/Neon-DB → Restore auf dem Server → Zählvergleich (Gruppen, Ratings,
  Kontakte, Admins) → Admin-Passwörter funktionieren (Hashes sind in der DB) → fertig.

#### WP-6.10 🧑 Umschalten (KI schreibt `docs/runbooks/cutover.md`)
1. 48 h vorher DNS-TTL senken.
2. Parallelbetrieb unter Test-Subdomains (z. B. `neu.fomo-dresden.app`), Abnahme-Checkliste.
3. DNS von `www`/Apex auf den Server, `verwaltung.` neu; `NEXT_PUBLIC_REGISTER_URL` zeigt auf
   `https://verwaltung.fomo-dresden.app/groups/register`.
4. Alte `fomo-pi.vercel.app` per Weiterleitung (Vercel-Redirect) für 3 Monate auf die neue
   Adresse.
5. **Rückweg:** DNS zurück auf Vercel (bleibt 30 Tage betriebsbereit).
6. Nach 30 Tagen stabil: Vercel-Projekte (`fomo`, `fomo-utsx`, `fomo-static`), Neon-DB
   und Umami Cloud abschalten; Google-Apps-Script/Sheet des alten Trackings löschen.

#### WP-6.11 Betriebsdoku für den Server
- **Dateien:** neu `docs/betrieb/server.md`; `static-site/docs/BETRIEBSHANDBUCH.md`
  umschreiben (Vercel-Teile raus); `static-site/docs/INBETRIEBNAHME.md` durch Verweis
  ersetzen; Vercel-spezifische Dateien (`vercel.json`, `static-site/vercel.json`,
  `.github/workflows/weekly-report-redeploy.yml`) **nach** dem Cutover entfernen.
- **Inhalt:** Starten/Stoppen, Update-Ablauf, Logs ansehen, Backup/Restore, Zertifikate,
  Secrets rotieren, Admin anlegen, Notfall „Seite weg", Wartungskalender.
- **Commit:** `docs(ops): server operations manual`

---

### Phase 7 — Übergabe

#### WP-7.1 🧑 Konten übertragen
- [ ] Repo in eine GitHub-Organisation (E8) übertragen; mind. 2 Owner mit 2FA; Secrets neu
      anlegen; Branch-Schutz prüfen.
- [ ] Domain zum StuRa-Registrar transferieren (Auth-Code aus dem Vercel-Dashboard,
      vorher DNS umstellen), Auto-Renew mit StuRa-Zahlungsmittel.
- [ ] Server-Zugänge, Admin-Konten (mind. 2 SUPER_ADMINs), Umami-Login, SMTP-Postfach an
      benannte StuRa-Personen.

#### WP-7.2 Impressum und Datenschutz auf den StuRa (Texte 🧑)
- KI ersetzt die Privatperson in `static-site/src/app/impressum/page.tsx`,
  `static-site/src/app/datenschutz/page.tsx` und den Seiten der Root-App durch die
  verantwortliche Stelle laut 🧑; Footer/FAQ („betrieben von …") vereinheitlichen.

#### WP-7.3 Abschluss
- KI: `TODO.md` aufräumen, `CLAUDE.md` final, Übergabe-Checkliste aus `audit.md` §7
  abhaken, Status in §9 vollständig.
- 🧑 Übergabegespräch mit Demo: Gruppe ändern, „Website aktualisieren", Backup-Restore,
  Admin anlegen.

---

### Später / optional (nicht Teil des Pflichtplans)
- **Prisma 7** (Driver-Adapter, `prisma.config.ts`) — eigenes WP nach Phase 6.
- **TU-Shibboleth** für Admins statt/zusätzlich zu Passwort + Basic-Auth.
- **Git-basiertes CMS (Decap)** für Texte (FAQ, Startseite) — dafür Texte vorher aus den
  Komponenten in JSON/Markdown auslagern.
- **Forgejo** auf dem StuRa-Server statt GitHub (E8).
- **Working-Set v3** (Fragen überarbeiten) — braucht Datenmigration der Gruppen-Ratings
  und Versionierung der `?r=`-Links.
- **Übertragbarkeit (Leipzig, Chemnitz):** Hochschul-spezifisches (Name, Domain,
  Kategorien, Impressum) in eine Konfigurationsdatei ziehen.

---

## 5. Prüfbefehle (Spickzettel)

```bash
# Statische Seite
cd static-site && npm ci && node scripts/validate-data.mjs && npx tsc --noEmit && npm test && npm run build

# Root-App (ohne echte DB)
npm ci && npx prisma generate && npx tsc --noEmit && npm test
DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_URL="$DATABASE_URL" AUTH_SECRET=dummy npx next build

# Lokale DB für Smoke-/E2E-Tests
docker compose up -d db && npx prisma migrate dev && npx prisma db seed && npm run dev
npx playwright test

# Items synchron?
node scripts/check-items-sync.mjs        # ab WP-4.7

# Server-Stack lokal
cd deploy && docker compose --profile proxy --profile monitoring up -d   # ab WP-6.2
```

---

## 6. Definition of Done (gesamt)

- [ ] Alle 12 Wartungsaufgaben aus `audit.md` §4 sind für **Persona A** ohne Terminal
      machbar oder haben ein Runbook mit ≤ 5 Schritten.
- [ ] Gruppe ändert ihre Daten in ≤ 2 Min, neue Gruppe registriert sich in ≤ 5–8 Min.
- [ ] „Website aktualisieren" bringt Änderungen in ≤ 2 Min live.
- [ ] Kein Dienst, Konto oder Zahlungsmittel hängt an einer Privatperson.
- [ ] Backups laufen täglich, ein Restore wurde getestet und dokumentiert.
- [ ] CI + Branch-Schutz aktiv; `npm audit` ohne kritische Lücken.
- [ ] Doku (CLAUDE.md, Runbooks, Betriebshandbuch, Server-Doku) beschreibt den echten Stand.

---

## 7. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Umbau stört die Live-Seite | Statische Seite nur in WP-2.2/2.3/3.1/4.6 angefasst, jeweils mit Build-Vergleich; Umzug außerhalb der Erstiwoche |
| Migration zerstört Daten | Migrationen nie im Build (WP-1.6), immer nach Backup (🧑), Restore getestet (WP-6.5) |
| Next-16-Upgrade bricht etwas still | Tests aus Phase 2 vorher; Browser-Stichprobe in WP-3.1/3.2 |
| Mail landet im Spam | Funktionspostfach des StuRa mit korrekter SPF/DKIM-Konfiguration (🧑, E3) |
| Server-Wissen hängt wieder an einer Person | WP-6.11 + mind. 2 Personen mit Zugang (WP-7.1) |
| KI ändert zu viel auf einmal | ein WP pro PR, Regeln §1, Hooks aus WP-2.5, Branch-Schutz |

---

## 8. Prompt-Vorlagen

**Standard (ein Arbeitspaket):**
```
Lies CLAUDE.md und docs/uebergabe/umsetzungsplan.md (Abschnitt 1 "Globale Regeln" und
Arbeitspaket WP-X.Y). Setze genau WP-X.Y um, nichts darüber hinaus.
Arbeite auf dem Branch wp-X-Y-<kurzname>. Wenn ein Schritt mit 🧑 markiert ist oder der
Code anders aussieht als beschrieben: stoppe und erkläre, was ein Mensch tun oder
entscheiden muss. Führe am Ende alle Prüfbefehle des WPs aus, berichte die Ergebnisse
wörtlich, setze den Status in §9 auf ✅ und entwirf eine PR-Beschreibung
(Was / Warum / Wie getestet / Was ein Mensch noch tun muss).
```

**Review eines KI-PRs (zweite KI-Instanz):**
```
Prüfe den Pull Request #<nr> gegen docs/uebergabe/umsetzungsplan.md WP-X.Y:
Sind alle Akzeptanzkriterien erfüllt? Verstößt etwas gegen die globalen Regeln (§1)?
Gibt es Änderungen außerhalb des WPs? Liste Funde nach Schwere.
```

**Wenn etwas kaputt ist:**
```
Lies CLAUDE.md und docs/runbooks/05-fehlersuche-und-deploy.md. Symptom: <Beschreibung>.
Finde die Ursache nur lesend und schlage einen Fix als eigenes kleines WP vor.
Ändere noch nichts.
```

---

## 9. Fortschritt (von der KI im jeweiligen PR aktualisieren)

| WP | Titel | Status | PR |
|---|---|---|---|
| 1.1 | Root-Build reparieren | ✅ | #3 |
| 1.2 | Admin-Auth absichern | ✅ | #4 |
| 1.3 | Next.js-Patch 15.5.x | ✅ | #5 |
| 1.4 | Datenleck `/groups`, alte Endpunkte | ✅ | #6 |
| 1.5 | Formular-Bugs | ✅ | #7 |
| 1.6 | Migration aus Build | ✅ | #8 |
| 1.7 | Repo-Hygiene | ✅ | #9 |
| 1.8 | 🧑 Checkliste Phase 1 | ⬜ | – |
| 2.1 | Test-Setup Root | ✅ | #10 |
| 2.2 | Matching-Tests | ✅ | #11 |
| 2.3 | Validierung im Build | ✅ | #12 |
| 2.4 | CI | ✅ | #13 |
| 2.5 | KI-Leitplanken | ✅ | #14 |
| 2.6 | Doku-Abgleich | ✅ | #15 |
| 2.7 | 🧑 Branch-Schutz | ⬜ | – |
| 3.1 | Next 16 statische Seite | ⬜ | |
| 3.2 | Next 16 Root-App | ⬜ | |
| 3.3 | Node 24 | ⬜ | |
| 4.1 | Verifizierung bleibt + Protokoll | ⬜ | |
| 4.2 | Dauerhafter Bearbeitungslink | ⬜ | |
| 4.3 | Link anfordern per Mail | ⬜ | |
| 4.4 | Formular/Admin entrümpeln | ⬜ | |
| 4.5 | Sync automatisieren (Vercel) | ⬜ | |
| 4.6 | Kategorien/Übersetzungen | ⬜ | |
| 4.7 | Eine Item-Quelle | ⬜ | |
| 5.1 | 🧑 Archiv | ⬜ | – |
| 5.2 | Altlasten entfernen | ⬜ | |
| 5.3 | DB verschlanken | ⬜ | |
| 5.4 | Rollen/Login | ⬜ | |
| 5.5 | Löschkonzept | ⬜ | |
| 5.6 | Impressum/Datenschutz Root-App | ⬜ | |
| 6.0 | 🧑 Klärung Referat Technik | ⬜ | – |
| 6.1 | App-Container | ⬜ | |
| 6.2 | Server-Stack | ⬜ | |
| 6.3 | Statischer Build auf dem Server | ⬜ | |
| 6.4 | Veröffentlichen + Webhook | ⬜ | |
| 6.5 | Backups | ⬜ | |
| 6.6 | Umami self-hosted | ⬜ | |
| 6.7 | Logo-Upload | ⬜ | |
| 6.8 | Monitoring | ⬜ | |
| 6.9 | 🧑 DB-Umzug | ⬜ | – |
| 6.10 | 🧑 Umschalten | ⬜ | – |
| 6.11 | Server-Doku | ⬜ | |
| 7.1 | 🧑 Konten | ⬜ | – |
| 7.2 | Impressum StuRa | ⬜ | |
| 7.3 | Abschluss | ⬜ | |
