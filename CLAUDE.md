# FOMO – Projektkontext für Claude Code

## Vision

FOMO hilft Erstis der TU Dresden, passende Hochschulgruppen zu finden. Jedes Jahr stehen über 6.300 neue Studierende vor dem Problem, dass sie die 100+ Hochschulgruppen nicht kennen. FOMO löst das mit einem Quiz: ~20 Fragen beantworten, algorithmisches Matching, Top-Empfehlungen mit Kontaktinfos.

Das Projekt wird vom StuRa TU Dresden finanziert (3.000€) und soll im September 2026 zur Erstsemester-Woche live gehen. Langfristig ist FOMO auf andere Hochschulen skalierbar (Leipzig, Chemnitz, etc.).

**Zielgruppe:** 18-25 Jahre, 80% mobil, digital-affin, kurze Aufmerksamkeitsspanne. Die App muss sich anfühlen wie ein modernes Consumer-Produkt, nicht wie ein Behördenformular. Spaß und Geschwindigkeit sind genauso wichtig wie statistische Korrektheit.

## Phasen-Überblick

### Phase 1: Pilot-Umfrage (✅ abgeschlossen – Mai 2026)

**Ergebnis:** 67 Sessions, Classic-Variante gewinnt (45%), Working Set v1.1 eingefroren (17 Items).

**Was gebaut wurde:** Landing Page, 4 Quiz-Varianten (scroll, classic, swipe, chat), Admin-Dashboard mit Statistiken, CSV-Export.

### Phase 2: Hochschulgruppen-Registrierung (April/Mai 2026)

**Ziel:** Die ~83 Gruppen bestätigen/korrigieren ihre 17 binären Attribute auf einer Checkliste.

**Was gebaut wird:** Token-basierte Einladungslinks, Attribut-Checkliste (vom Scraper vorausgefüllt), Admin-Verifizierung.

**Wichtig:** Die Gruppen werden auf Attribut-Ebene eingeordnet, nicht auf Fragen-Ebene. Die Studierenden-Fragen können sich ändern ohne dass die Gruppen nochmal ran müssen.

### Phase 3: Matching & Ergebnisse (Mai–Juli 2026)

**Ziel:** Studenten-Antworten mit Gruppen-Profilen matchen, Empfehlungen anzeigen.

**Was gebaut wird:** Matching-Algorithmus (client-side, läuft im Browser), Ergebnisseite mit Top 5-10 Gruppen.

**Client-side Matching:** Keine Nutzerdaten werden an den Server geschickt — DSGVO-konform by design.

### Phase 4: Launch (August/September 2026)

**Ziel:** APP_MODE=live umschalten, Gewinner-Variante als Default, StuRa-Abnahme.

## ⚡ Stand Juli 2026 — was WIRKLICH live ist (überschreibt Obiges bei Widerspruch)

Die öffentliche FOMO-Seite ist **nicht** die dynamische App, sondern der
**statische Export in `static-site/`** — live auf **www.fomo-dresden.app**
(eigenes Vercel-Projekt, Root Directory `static-site`, deployt bei jedem Push
auf `main`). Kernfakten für die Arbeit daran:

- Matching v2 (21 WS2-Items + 8 Filter) läuft client-side gegen
  `selfRating.answers`; die alten 17 Binär-Attribute werden nicht mehr genutzt.
- **Nur verifizierte Gruppen** sind im Quiz-Matching (`getMatchableGroups()`);
  gescrapte/unbestätigte nur im Verzeichnis hinter einem Toggle.
  Datenstand 11.07.2026: 41 verifiziert / 52 unbestätigt / 93 gesamt.
- Studie 2 wurde verworfen; stattdessen anonyme Live-Daten via Umami
  (Events in `static-site/src/lib/analytics.ts`, Konzept in
  `static-site/docs/DATEN-SAMMELN-KONZEPT.md`). Auswertung:
  `npm run report` bzw. live unter `/report/` (baut bei jedem Deploy).
- DE + EN (unter `/en/`), SEO komplett (Sitemap, hreflang, JSON-LD,
  Kategorie-Landingpages), Impressum/Datenschutz vorhanden.
- Doku: `static-site/README.md`, Betrieb für Nicht-Techniker in
  `static-site/docs/BETRIEBSHANDBUCH.md`, KI-Arbeitsregeln in
  `static-site/docs/KI-MITARBEIT.md`. **Offene Aufgaben: `TODO.md` (Root).**
- Die dynamische Root-App bleibt internes Datenerfassungs-Tool
  (Registrierung/Admin) — bei Arbeiten an der öffentlichen Seite NICHT anfassen.

## Tech-Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Datenbank:** PostgreSQL 16 (lokal Docker, Production Vercel Postgres)
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth v5) – Credentials, Phase 4: SAML/SSO
- **Deployment:** Vercel (Pilot/Collect), später Uni-Server (Docker)
- **Testing:** Vitest + Playwright
- **Lizenz:** AGPL-3.0

## Architektur-Prinzipien

1. **Mobile-first:** 80% der Nutzer sind auf dem Handy. Jede Seite muss auf 375px gut aussehen.
2. **Client-side Matching:** Fragen + Gruppenprofile werden einmal geladen, Matching im Browser. Keine Nutzerdaten an den Server.
3. **Kein localStorage/sessionStorage:** Kann SecurityError in Sandbox-Umgebungen werfen. State nur über React State oder URL-Parameter.
4. **APP_MODE:** Umgebungsvariable steuert was die App zeigt (pilot/collect/live). Kein Code-Umbau nötig beim Phasenwechsel.
5. **Seed-Daten auf Deutsch:** Die App ist für TU Dresden, alle UI-Texte und Daten auf Deutsch.
6. **SPDX-Header:** Jede Quellcode-Datei braucht `// SPDX-License-Identifier: AGPL-3.0-only`.

## Design-Philosophie

**Das Quiz soll sich anfühlen wie eine App, nicht wie eine Umfrage.**

Die Zielgruppe nutzt TikTok, Instagram, Tinder. Sie erwarten:

- Sofortige Reaktion auf Input (keine Ladezeiten, keine Seitenreloads)
- Animationen und Micro-Interactions (Buttons die reagieren, Karten die sliden)
- Visuelles Feedback (Fortschrittsbalken, Farben die sich ändern, Emojis)
- Kurze Texte, große Touch-Targets, ein Gedanke pro Screen

Spaß und Wissenschaftlichkeit sind kein Widerspruch – das ist die zentrale Designaufgabe.

## Farbschema & Typografie (Light Blue Theme)

```text
Fonts:
  Headlines:      'Archivo Black', sans-serif
  Body:           'Lexend', wght 300–700

Farben:
  Hintergrund:    #ADD8E6 (Light Blue)
  Primär/Dunkel:  #1a2a35 (Dark Navy)
  Weiß:           #fff (Poster/Card-Hintergrund)
  Button:         #1a2a35 bg, #ADD8E6 text
  Button Hover:   #2a3a45
  Text dunkel:    #1a2a35
  Text body:      #5a7a8a
  Text muted:     #7a9aaa / #8aaaba
  Text footer:    #4a7a8a
  Akzent muted:   #5a8a9a
  Placeholder bg: linear-gradient(135deg, #e8f4f8, #d4eaf0)
```

Stilistik: Brutalist-Poster-Ästhetik mit dicken Borders (4px solid #1a2a35), Uppercase-Headlines, klarem Grid-Layout.

## Matching-Algorithmus

```text
score(User, Group) = Σ effWeight_i × similarity_i / Σ effWeight_i

effWeight_i  = userWeight_i × attrWeight_attr × (1 / itemCount_attr)

userWeight:  |normalized - 0.5| × 2  (Neutral = 0, wird ignoriert)
attrWeight:  2 × min(yes, no) / n    (50/50-Split = 1.0, alle gleich = 0.0)
itemCount:   Anzahl Items auf dieses Attribut (verhindert Mehrfachzählung)
Similarity:  1 - |userValue - groupAttribute|  (mit Inverse-Support)
Minimum:     ≥ 5 nicht-neutrale Antworten, sonst keine Ergebnisse
```

Alles client-side — keine Nutzerdaten an den Server. Implementierung: `src/lib/quiz/matching.ts`.

## Gamification-Backlog (NICHT JETZT BAUEN – aber architektonisch vorbereiten)

Diese Features kommen nach dem Pilot, wenn die Basis steht und wir Daten haben:

- **Ergebnis-Reveal:** Karten werden einzeln aufgedeckt mit Countdown/Animation
- **Persönlichkeits-Profil:** Radar-Chart ("Du bist ein kreativer Teamplayer!")
- **Badges:** "Der Entdecker" (viele internationale Gruppen), "Der Macher" (hands-on), etc.
- **Share-Cards:** Generierte Bilder für Instagram Stories ("Mein FOMO-Ergebnis")
- **Leaderboard:** "X Erstis haben heute FOMO gemacht" als Social Proof

## Coding-Konventionen

- Alle Komponenten als funktionale Components mit TypeScript
- Server Components by default, 'use client' nur wenn nötig
- API-Routen mit Zod-Validation für Input
- Prisma-Queries nur in Server Components oder API-Routen
- Deutsche UI-Texte, englische Code-Kommentare und Variablennamen
- Commits auf Englisch, konventionelle Commit-Messages (feat:, fix:, docs:, etc.)

## Aufgaben & Pläne

**Alle offenen Aufgaben stehen in `TODO.md` (Root)** — das ist die eine
zentrale To-do-Datei (Stand Juli 2026). Es gibt keine aktiven Plan-Dateien
mehr; alle abgeschlossenen Pläne (Phase 2, Varianten-System,
Algorithmus-Fixes, V2-Integration, Studie 2) liegen als Referenz in
`CLAUDE-pläne/archiv/`.

Lies die CLAUDE.md und dann `TODO.md` bevor du mit der Implementierung
anfängst. Bei Widersprüchen gilt: diese CLAUDE.md hat Priorität.
