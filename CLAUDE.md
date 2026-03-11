# FOMO – Projektkontext für Claude Code

## Vision

FOMO hilft Erstis der TU Dresden, passende Hochschulgruppen zu finden. Jedes Jahr stehen über 6.300 neue Studierende vor dem Problem, dass sie die 100+ Hochschulgruppen nicht kennen. FOMO löst das mit einem Quiz: ~20 Fragen beantworten, algorithmisches Matching, Top-Empfehlungen mit Kontaktinfos.

Das Projekt wird vom StuRa TU Dresden finanziert (3.000€) und soll im September 2026 zur Erstsemester-Woche live gehen. Langfristig ist FOMO auf andere Hochschulen skalierbar (Leipzig, Chemnitz, etc.).

**Zielgruppe:** 18-25 Jahre, 80% mobil, digital-affin, kurze Aufmerksamkeitsspanne. Die App muss sich anfühlen wie ein modernes Consumer-Produkt, nicht wie ein Behördenformular. Spaß und Geschwindigkeit sind genauso wichtig wie statistische Korrektheit.

## Phasen-Überblick

### Phase 1: Pilot-Umfrage (JETZT – März/April 2026)
**Ziel:** 60 Kandidaten-Fragen an Studierenden testen, statistisch die besten ~20 identifizieren.
**Was gebaut wird:** Landing Page, 4 Quiz-Varianten (scroll, classic, swipe, chat), Admin-Dashboard mit Statistiken, CSV-Export.
**Warum 4 Varianten:** Wir wissen nicht welches UI-Erlebnis die höchste Abschlussrate hat. Die Varianten sind ein A/B-Test – am Ende gewinnt eine.
**Warum Priming:** Ohne Kontextrahmen beantworten Leute die Fragen aus allgemeiner Perspektive statt aus Hochschulgruppen-Sicht. Das verzerrt die statistische Auswertung.

### Phase 2: Hochschulgruppen-Registrierung (April/Mai 2026)
**Ziel:** Die ~83 Gruppen bestätigen/korrigieren ihre 20 binären Attribute auf einer Checkliste.
**Was gebaut wird:** Token-basierte Einladungslinks, Attribut-Checkliste (vom Scraper vorausgefüllt), Admin-Verifizierung.
**Wichtig:** Die Gruppen werden auf Attribut-Ebene eingeordnet, nicht auf Fragen-Ebene. Die Studierenden-Fragen können sich ändern ohne dass die Gruppen nochmal ran müssen.

### Phase 3: Matching & Ergebnisse (Mai–Juli 2026)
**Ziel:** Studenten-Antworten mit Gruppen-Profilen matchen, Empfehlungen anzeigen.
**Was gebaut wird:** Matching-Algorithmus (client-side), Ergebnisseite mit Top 5-10 Gruppen.
**Client-side Matching:** Der Algorithmus läuft komplett im Browser. Keine Nutzerdaten werden an den Server geschickt. Das ist ein bewusstes Design-Prinzip für DSGVO-Konformität und Vertrauen.
**Gamification-Potenzial:** Die Ergebnisseite ist der Ort wo Gamification am meisten bringt – Reveal-Animationen, Share-Funktion, "Dein Profil"-Radar-Chart, Badge-System ("Du bist ein Teamplayer!"). Das kommt aber erst wenn die Basis steht.

### Phase 4: Launch (August/September 2026)
**Ziel:** APP_MODE=live umschalten, Gewinner-Variante als Default, StuRa-Abnahme.
**Was gebaut wird:** Finales Polishing, Deployment auf Uni-Server, Monitoring.

## Tech-Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Datenbank:** PostgreSQL 16 (lokal Docker, Production Vercel Postgres)
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth v5) – Phase 1: Credentials, Phase 2: SAML/SSO
- **Deployment:** Vercel (Pilot/Collect), später Uni-Server (Docker)
- **Testing:** Vitest + Playwright
- **Lizenz:** AGPL-3.0

## Architektur-Prinzipien

1. **Mobile-first:** 80% der Nutzer sind auf dem Handy. Jede Seite muss auf 375px gut aussehen.
2. **Client-side Matching:** Fragen + Gruppenprofile werden einmal geladen, Matching im Browser. Keine Nutzerdaten an den Server.
3. **Kein localStorage/sessionStorage:** Kann SecurityError in Sandbox-Umgebungen werfen. State nur über React State oder URL-Parameter.
4. **Varianten-System:** UI-Logik ist komplett getrennt von Business-Logik. Alle Varianten teilen sich denselben useSurveyState-Hook. So kann eine Variante gelöscht werden ohne die andere zu beeinflussen.
5. **APP_MODE:** Umgebungsvariable steuert was die App zeigt (pilot/collect/live). Kein Code-Umbau nötig beim Phasenwechsel.
6. **Seed-Daten auf Deutsch:** Die App ist für TU Dresden, alle UI-Texte und Daten auf Deutsch.
7. **SPDX-Header:** Jede Quellcode-Datei braucht `// SPDX-License-Identifier: AGPL-3.0-only`.

## Design-Philosophie

**Das Quiz soll sich anfühlen wie eine App, nicht wie eine Umfrage.**

Die Zielgruppe nutzt TikTok, Instagram, Tinder. Sie erwarten:
- Sofortige Reaktion auf Input (keine Ladezeiten, keine Seitenreloads)
- Animationen und Micro-Interactions (Buttons die reagieren, Karten die sliden)
- Visuelles Feedback (Fortschrittsbalken, Farben die sich ändern, Emojis)
- Kurze Texte, große Touch-Targets, ein Gedanke pro Screen

**Aber:** Die Umfrage muss trotzdem statistisch valide sein. Das heißt:
- Priming-Screen der den Kontext "Hochschulgruppen" setzt
- Dimensions-Header die den Kontext in jedem Block auffrischen
- Mid-Survey Reminder bei der Halbzeit
- Priming-Check am Ende (hat die Person wirklich an Hochschulgruppen gedacht?)
- Keine Suggestivfragen, keine sozialen Erwünschtheitseffekte

Spaß und Wissenschaftlichkeit sind kein Widerspruch – das ist die zentrale Designaufgabe.

## Farbschema & Typografie (Light Blue Theme)

```
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

Stilistik: Brutalist-Poster-Ästhetik mit dicken Borders (4px solid #1a2a35), Uppercase-Headlines, klarem Grid-Layout. Die Landing Page sieht aus wie ein gestaltetes Plakat.

## Matching-Algorithmus (Vorschau)

```
score(User, Group) = Σ weight_i × similarity(user_answer_i, group_profile_i)

Likert:       similarity = 1 - |user - group| / 4
Slider:       similarity = 1 - |user - group| / range
YesNo:        similarity = 1 wenn gleich, 0 wenn verschieden
SingleChoice: similarity = 1 wenn gleich, 0 sonst
MultiChoice:  similarity = Jaccard-Index (|Schnitt| / |Vereinigung|)

Ergebnis: Top 5-10 Gruppen, normalisiert auf 0-100%
```

## Gamification-Backlog (NICHT JETZT BAUEN – aber architektonisch vorbereiten)

Diese Features kommen nach dem Pilot, wenn die Basis steht und wir Daten haben:

- **Ergebnis-Reveal:** Karten werden einzeln aufgedeckt mit Countdown/Animation
- **Persönlichkeits-Profil:** Radar-Chart mit den 10 Dimensionen ("Du bist ein kreativer Teamplayer!")
- **Badges:** "Der Entdecker" (viele internationale Gruppen), "Der Macher" (hands-on), etc.
- **Share-Cards:** Generierte Bilder für Instagram Stories ("Mein FOMO-Ergebnis")
- **Streak/Progress:** "Du hast 10/20 Fragen geschafft!" mit Konfetti-Animation
- **Sound-Effects:** Subtile Sounds bei Swipe/Klick (optional, default aus)
- **Leaderboard:** "X Erstis haben heute FOMO gemacht" als Social Proof

**Architektonische Vorbereitung:** Die Ergebnisseite sollte so gebaut werden, dass MatchResult-Objekte leicht um zusätzliche Daten ergänzt werden können (Badges, Dimension-Scores für Radar-Chart, etc.). Die Share-Funktion sollte einen Hook haben, in den später Bild-Generierung eingehängt werden kann.

## Coding-Konventionen

- Alle Komponenten als funktionale Components mit TypeScript
- Server Components by default, 'use client' nur wenn nötig
- API-Routen mit Zod-Validation für Input
- Prisma-Queries nur in Server Components oder API-Routen
- Deutsche UI-Texte, englische Code-Kommentare und Variablennamen
- Commits auf Englisch, konventionelle Commit-Messages (feat:, fix:, docs:, etc.)

## Aktive Plan-Dateien

Diese Dateien im Repo enthalten detaillierte Implementierungspläne:

| Datei | Inhalt | Status |
|-------|--------|--------|
| PILOT-IMPLEMENTATION-PLAN.md | Pilot-Umfrage: Seiten, API, DB | Aktiv |
| IMPORT-GROUPS-PLAN.md | CSV-Import der 83 Hochschulgruppen | Aktiv |
| VARIANT-SYSTEM-PLAN.md | 4 Layout-Varianten (scroll/classic/swipe/chat) | Aktiv |
| SURVEY-PRIMING-PLAN.md | Priming-Screen, Dimensions-Header, Mid-Survey Reminder | Aktiv |
| LIVE-QUIZ-PLAN.md | Live-Quiz: 20 Fragen, Matching-Algorithmus, Ergebnisseite | **Aktiv** |
| GROUPS-SURVEY-PLAN.md | Hochschulgruppen-Registrierung: Thesen + Attribut-Korrektur | **Aktiv** |
| PILOT-TO-LIVE-PLAN.md | Übergang Pilot → Live-Quiz | Noch nicht starten |
| TESTING-PLAN.md | Vollständiger Test & Cleanup | Nach Implementierung |
| CODE-AUDIT-PLAN.md | Sicherheits- und Qualitäts-Audit | Nach Implementierung |

Lies die CLAUDE.md und dann alle aktiven Plan-Dateien im Ordner `CLAUDE-pläne/` bevor du mit der Implementierung anfängst. Bei Widersprüchen zwischen Plänen gilt: diese CLAUDE.md hat Priorität.
