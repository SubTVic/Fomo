<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Mit einer KI an der statischen FOMO-Version arbeiten

Anleitung für alle, die (mit Unterstützung einer Coding-KI) an der statischen
Version unter `static-site/` mitarbeiten wollen — der öffentlichen Seite auf
www.fomo-dresden.app.

## 1. Zugang (einmalig)

- **GitHub:** Zugriff auf `SubTVic/Fomo` — entweder als Collaborator
  (Repo → Settings → Collaborators) oder über **Fork + Pull Request**
  (dafür braucht es keine Rechte).
- **Wichtig:** **Nie direkt auf `main` pushen** — `main` deployt automatisch
  live. Immer einen eigenen Branch erstellen (`feature/mein-thema`) und einen
  Pull Request aufmachen.

## 2. Welches KI-Tool?

Am besten ein **agentisches** Tool, das selbst Dateien liest, ändert und
Builds ausführt — z. B. **Claude Code** (claude.ai/code im Browser, oder als
CLI/VS-Code-Extension). Cursor o. ä. funktioniert auch. Ein reines
Chat-Fenster ist mühsam, weil man alles von Hand kopieren muss.

Das Repo ist vorbereitet: Die **`CLAUDE.md`** im Root (Projektkontext,
Design-Regeln, Architektur-Prinzipien) liest Claude Code automatisch. Dazu
`static-site/README.md` und die Konzepte in `static-site/docs/`.

## 3. Die goldenen Regeln (der KI immer mitgeben)

Diesen Block als erste Nachricht an die KI kopieren:

```
Wir arbeiten NUR im Ordner static-site/ (statischer Next.js-Export für
www.fomo-dresden.app). Lies zuerst CLAUDE.md im Repo-Root und
static-site/README.md. Regeln:

1. Die dynamische App im Repo-Root (src/, prisma/, ...) NICHT anfassen.
2. static-site/ ist ein reiner Static Export (output: 'export') — keine
   API-Routen, keine Datenbank, kein Server-Code. Daten kommen ausschließlich
   aus static-site/data/*.json zur Build-Zeit.
3. KEIN localStorage/sessionStorage (SecurityError-Risiko) — State nur über
   React-State oder URL-Parameter.
4. Jede neue Quellcode-Datei bekommt den Header:
   // SPDX-License-Identifier: AGPL-3.0-only
5. UI-Texte auf Deutsch (englische Zwillinge unter /en pflegen:
   quiz-translations.ts, group-copy.ts), Code-Kommentare auf Englisch,
   Commits auf Englisch (feat:/fix:/docs:).
6. Design: Brutalist-Poster-Stil — 4px Navy-Borders (#1a2a35), Hintergrund
   #ADD8E6, Archivo Black für Headlines, Lexend für Text. Mobile-first,
   alles muss bei 375px funktionieren (keine horizontalen Overflows!).
7. Das Quiz matcht NUR verifizierte Gruppen (getMatchableGroups, nicht
   getGroups) — das nicht ändern.
8. Vor jedem Push: cd static-site && npm run build muss fehlerfrei
   durchlaufen. Bei Datenänderungen zusätzlich: node scripts/validate-data.mjs
9. Arbeite auf einem Feature-Branch, nie direkt auf main (main deployt
   automatisch live).
```

## 4. Typischer Arbeitsablauf

1. **Branch erstellen:** `git checkout -b feature/mein-thema`
2. **Der KI die Aufgabe geben** (mit dem Regelblock oben, falls neues Gespräch)
3. **Lokal testen:** `cd static-site && npm install && npm run dev`
   → http://localhost:3000 — im Browser ansehen, besonders in der
   Handy-Ansicht (375px)
4. **Build-Gate:** `npm run build` muss grün sein (macht die KI meist selbst)
5. **Push + Pull Request** → Review → Merge → geht automatisch live

## 5. Wo was liegt (Spickzettel)

| Was | Wo |
|---|---|
| Seiten (DE) | `static-site/src/app/` (Landing, `/quiz`, `/groups`, `/groups/[slug]`) |
| Seiten (EN) | `static-site/src/app/en/` |
| Quiz-Logik & Matching | `static-site/src/lib/matching.ts`, `results.ts`, Komponenten in `src/components/quiz/` |
| Gruppendaten | `static-site/data/groups.json` (+ `logos.json`, `quiz.json`) |
| EN-Übersetzungen | `static-site/src/lib/group-translations.ts`, `quiz-translations.ts` |
| FAQ (Landing) | `static-site/src/lib/faq.ts` |
| SEO (Sitemap, Strukturdaten) | `static-site/src/app/sitemap.ts`, `src/lib/site.ts` |
| Analytics-Events | `static-site/src/lib/analytics.ts` |
| Betrieb/Übergabe-Doku | `static-site/docs/BETRIEBSHANDBUCH.md` |

## 6. Was schiefgehen kann (und warum es nicht schlimm ist)

- Baut der Branch nicht, blockiert Vercel das Deployment — die Live-Seite
  bleibt einfach auf dem alten Stand.
- Jede Änderung ist über die Git-Historie per Revert rückgängig zu machen.
- Einzige echte Vorsicht: **niemals Backup-Dateien aus der Admin-App
  committen** (enthalten persönliche Kontaktdaten) — nur die generierte
  `groups.json` ist öffentlich unbedenklich.
