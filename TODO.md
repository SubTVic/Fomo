# FOMO – Offene Aufgaben

**Stand: Oktober 2026** (Status-Tabelle; einzelne Abschnitte unten älter) — die
**eine zentrale To-do-Datei** des Projekts. Der laufende Umbau (Sicherheit, Tests,
Datenpflege, Umzug auf den StuRa-Server) ist in Arbeitspakete gegliedert:
`docs/uebergabe/umsetzungsplan.md` (§9 = Fortschritt).
(Hier ist `static-site/docs/AUFGABEN-NACH-AUDIT.md` aufgegangen; die alte
Phasen-To-do von Mai 2026 ist unten unter „Erledigt/Verworfen" archiviert.)

Kontext zum Projekt: `CLAUDE.md` (Root). Anleitungen je Aufgabe:
`docs/runbooks/`. Betrieb ohne Programmierkenntnisse:
`static-site/docs/BETRIEBSHANDBUCH.md`.

---

## Status-Überblick

| Bereich | Status |
| --- | --- |
| **Öffentliche Seite** `static-site/` | ✅ **Live auf www.fomo-dresden.app** (Vercel, deployt bei jedem Push auf `main`) |
| Matching v2 (21 Items + 8 Filter, client-side) | ✅ Live — nur verifizierte Gruppen im Quiz |
| Datenstand | 51 verifiziert / 44 unbestätigt / 95 gesamt (Export vom 17.08.) |
| Umami-Tracking + Live-Report `/report/` | ✅ Läuft mit echten Daten (Env-Vars in Vercel gesetzt, 11.07.) |
| Dynamische Root-App (Registrierung/Admin) | 🔄 Internes Tool; Build, Admin-Schutz, Formular repariert (Plan Phase 1), Altlasten-Entfernung folgt (Phase 5) |
| Qualitäts-Netz | ✅ CI auf jedem PR, Datenprüfung vor jedem Build, Tests, KI-Leitplanken (Plan Phase 2) |
| Studie 2 (Mitglieder-Validierung) | ❌ Verworfen — ersetzt durch anonyme Live-Daten (Umami) |
| Nächster Meilenstein | Datenpflege reparieren (Plan Phase 4); Next.js 16 + Node 24 erledigt (Phase 3) |

---

## §1 Admin-Aufgaben (kein Code) — Reihenfolge = Wirkung pro Aufwand

### 1.1 Drei doppelte Gruppen bereinigen (15 Min) — sichtbar im Live-Report!

Im Live-Report taucht **Rotaract Club Dresden zweimal** in „Meistgeklickte
Gruppen" auf — die Duplikate klauen sich gegenseitig Klicks und Rankings.
In der **Admin-App** (dynamische Root-App) je **eine** Kopie deaktivieren,
dann **Daten-Sync** starten (Admin-Dashboard → „Daten-Sync öffnen", Runbook 01) und
den entstehenden PR mergen.

| Behalten ✅ | Deaktivieren ❌ | Warum |
|---|---|---|
| `rotaract-club-dresden` (dresden-vorstand@rotaract.de) | `rotaract-club-dresden-2` (private Adresse eines Mitglieds) | **Wichtigster Fall: beide verifiziert, konkurrieren im Quiz.** Offizielle Vorstands-Mail behalten. Im Zweifel Rotaract fragen, welche Anmeldung die „echte" ist. |
| `technische-universitaet-dresden-robotik-arbeitsgruppe` (verifiziert, 3 Bewertungen) | `tu-dresden-robotik-ag-turag` (unbestätigt) | Verifizierte Kopie ist besser. Logo ist auf beide Slugs verankert, bleibt sichtbar. |
| `kritmed` | `kritmed-dresden` | Beide unbestätigt — nimm die, unter der die Gruppe erreichbar ist. |

### 1.2 Neun Gruppen ohne Aktivitäts-Filter (E-Mail-Runde) — größter Bias-Hebel

Diese Gruppen haben keine Filter angegeben und können **nie weggefiltert
werden** → strukturell ~1,8× so oft in den Ergebnissen wie fair. Die
Live-Daten verschärfen das: **~96 % der Quiz-Durchläufe starten MIT Filtern**
(25 von 26) — der Vorteil wirkt also praktisch immer. Lösung: eine Angabe
pro Gruppe, keine Programmierung.

**Warum das der wichtigste Hebel gegen „immer dieselben Gruppen oben" ist:**
Beliebte Filter treffen nur wenige verifizierte Gruppen (Outdoor: 3, Musik: 4,
Sport: 4 explizit) — der Rest des Pools sind die 9 filterlosen. Bei einem
12-Gruppen-Pool ist 25 % Top-3-Rate schon der faire Erwartungswert; echte
Vielfalt entsteht erst durch größere Pools (mehr Registrierungen + diese 9
Filterangaben). Der Code-Anteil des Problems (deterministischer Tie-Breaker)
ist seit Juli behoben (faire Gleichstands-Rotation pro Nutzer, s. u.).

Die 8 Filter (Mehrfachauswahl): Hands-on/Werkstatt · Kunst
(Theater/Film/Design/Foto) · Wettbewerbe · Musik · Outdoor/Natur ·
Tech/Digital · Hochschulpolitik · Sport.

| Gruppe | Kontakt |
|---|---|
| AufeinanderAchten | info@aufeinanderachten.de |
| Effektiver Altruismus | dresden@effektiveraltruismus.de |
| FIRST AID FOR ALL – Dresden | firstaidforall.dresden@mailbox.tu-dresden.de |
| HSG Grundvorlesung ökologische Nachhaltigkeit | vl.sustainability@tu-dresden.de |
| Heinrich-Cotta-Club e.V. | *(keine Mail hinterlegt — über Website kontaktieren)* |
| Hochschul-SMD Dresden | dresden@smd.org |
| Leo-Club Dresden 'August der Starke' | augustderstarke@leo-clubs.de |
| Nightline Dresden e.V. | marketing@nightline-dresden.de |
| VWI HG Dresden e.V. | vorstand@vwi-dresden.de |

**Fertige E-Mail-Vorlage:**

> Betreff: Kurze Rückfrage zu eurem FOMO-Profil (1 Minute)
>
> Hallo liebe [Gruppenname],
>
> ihr seid auf FOMO gelistet (www.fomo-dresden.app) — dem Quiz, das Erstis
> passende Hochschulgruppen vorschlägt. Damit euch die richtigen Leute finden,
> fehlt uns noch **eine** Angabe: In welche dieser Aktivitäts-Kategorien passt
> ihr? (Mehrfachauswahl, gern auch „keine davon")
>
> ☐ Hands-on/Werkstatt ☐ Kunst & Kultur ☐ Wettbewerbe ☐ Musik
> ☐ Outdoor & Natur ☐ Tech & Digital ☐ Hochschulpolitik ☐ Sport
>
> Einfach zurückschreiben, wir tragen es ein. Danke!
>
> Viele Grüße, das FOMO-Team

Antworten in der Admin-App eintragen → neu exportieren (wie 1.1).

### 1.3 GitHub-Secrets für die Report-Automatik setzen (5 Min)

GitHub → Repo → Settings → Secrets and variables → Actions:

| Secret | Wofür | Wert |
|---|---|---|
| `UMAMI_API_KEY` | Button „Report erstellen (ohne Deploy)" → Download-Artifact | derselbe wie in Vercel |
| `UMAMI_WEBSITE_ID` | dito | `56708403-b68d-4f0a-957b-55d9b68b9ff0` |
| `VERCEL_DEPLOY_HOOK_URL` | Montags-Auto-Refresh von `/report/` + Button „Weekly report redeploy" | Vercel → Settings → Git → Deploy Hook erstellen |

(Was die zwei Buttons tun / nicht tun: Betriebshandbuch §7.)

### 1.4 Umami-API-Key rotieren (5 Min, empfohlen)

Der aktuelle Key wurde einmal im Klartext in einem Chat geteilt. In Umami
einen neuen Key erzeugen → in Vercel (`UMAMI_API_KEY`) und im
GitHub-Secret (1.3) aktualisieren, alten Key löschen.

### 1.5 Betrieb absichern (einmalig, je 5 Min)

- [ ] **Google Search Console:** Domain verifizieren + Sitemap
      `https://www.fomo-dresden.app/sitemap.xml` einreichen.
- [ ] **Uptime-Monitor** (z. B. UptimeRobot, kostenlos) auf
      www.fomo-dresden.app → mailt bei Ausfall.

### 1.6 Datenpflege-Kampagne (laufend) — der eigentliche Qualitäts-Hebel

- **Mehr Registrierungen:** 41 von 93 verifiziert. Jede weitere verbessert
  das Matching mehr als jede Code-Änderung — wichtigster Hebel vor der
  Erstiwoche.
- **Kategorien:** 62 von 93 Gruppen stehen in „Sonstiges" — jede Zuordnung
  füllt eine SEO-Kategorieseite und macht den Browse-Filter nützlich.
- **Logos:** nur ~11 vorhanden; Mitgliederzahlen: 27; „Nächstes Event": 0.
  Beim Registrierungs-Kontakt gleich mit abfragen.
- Nach der Erstiwoche: Gruppen fragen, ob FOMO-Zulauf ankam (ausgehende
  Links tragen `utm_source=fomo-dresden`, Mails den Betreff
  „Anfrage über FOMO" — die Gruppen können es selbst erkennen).

---

## §2 Entwicklung (Code) — Backlog static-site

- [x] **Faire Gleichstands-Sortierung** (Juli 2026): Sortierung nach
      ungerundetem Score; bei echtem Gleichstand gewinnen explizite
      Filter-Treffer vor filterlosen Durchrutschern; Rest-Gleichstände
      rotieren per Nutzer-Hash (deterministisch pro ?r=-Link, aber über die
      Nutzerschaft gestreut) statt immer raterCount→Alphabet. Simulation:
      Leo-Club −9pp, Betonbootteam −4pp Top-3-Rate.
- [ ] **Bias-Simulation an echtes Filterverhalten anpassen:** Die Sim in
      `static-site/scripts/report.mjs` rechnet mit 50 % filterlosen Profilen;
      real starten ~96 % MIT Filtern (Live-Report 12.07.). Filterwahl der Sim
      an die beobachtete Verteilung koppeln → Bias-Abschnitt wird realistischer.
- [ ] **Neue Report-Abschnitte beobachten:** „Geklickt vs. gerankt"
      (Quiz-Score) und „Selbsterkennung" erscheinen erst, wenn `pick`- bzw.
      `self-recognition`-Events eingehen (Tracking live seit 12.07. vormittags).
      Nach ein paar Tagen prüfen, ob die Zahlen plausibel sind.
- [ ] **Working-Set v3** (nach der Erstiwoche, wenn n groß genug): Die
      Item-Diagnose im `/report/` markiert aktuell 4 Streichkandidaten
      (einseitige Items, u. a. „Hands-on" 77 % Zustimmung, „Einsteiger" 73 %).
      Bei n=26 noch nicht entscheidungsreif — mit Erstiwochen-Daten neu bewerten.
- [ ] **Gamification-Backlog:** Ergebnis-Reveal,
      Persönlichkeits-Profil, Badges, Share-Cards, Leaderboard — erst nach
      der Erstiwoche, wenn Daten da sind.
- [ ] **Link-Prüfung scharf schalten:** `static-site/scripts/validate-data.mjs`
      lässt 7 verifizierte Gruppen mit kaputten Links (`KNOWN_BAD_URLS`) vorerst
      nur warnen. Nach dem nächsten Daten-Sync mit korrigierten URLs (WP-1.8)
      die Liste leeren — dann bricht jeder kaputte Link den Build ab.
- [ ] **Lint-Warnungen `react-hooks/set-state-in-effect` abbauen** (seit Next 16,
      WP-3.1): `BackLink`, `Navbar`, `QuizFlow` lesen `window.location` erst nach
      dem Laden (z. B. auf `useSyncExternalStore` umstellen); `ItemScreen` und
      `ResultsScreen` setzen Animations-State im Effect zurück (besser per `key`
      bzw. im Klick-Handler). Danach die Regel in `eslint.config.mjs` wieder auf
      `error` stellen. Verhalten mit dem Quiz-Durchlauf (375 px) gegenprüfen.
- [ ] **Self-Hosting: echte 404 statt Startseite** (`static-site/nginx.conf`):
      `try_files … /index.html` liefert unbekannte Pfade als Startseite mit
      Status 200 aus (Soft-404, schlecht für Suchmaschinen). Beim Server-Stack
      (Plan WP-6.2) auf `try_files $uri $uri/ $uri.html =404;` umstellen und testen.
      Betrifft nur Docker/nginx, nicht Vercel.

---

## §3 Dynamische Root-App (internes Tool)

Die Root-App bleibt Datenerfassungs-Tool (Registrierung + Admin). Offen:

- [ ] Gruppen-Invite-Links generieren + mailen → Ziel: möglichst viele
      `GroupSelfRating`-Registrierungen vor der Erstiwoche (siehe §1.6).
- [ ] Duplikate deaktivieren (siehe §1.1) — passiert in dieser App.
- [ ] **Git-History bereinigen (Entscheidung E2, nur Repo-Owner):** Die Datei
      `data/admin-export.json` (Pilot-Sessions mit Freitexten) ist aus dem
      aktuellen Stand entfernt, steht aber noch in der History des öffentlichen
      Repos. Falls E2 = ja: Owner bereinigt mit `git filter-repo`, danach müssen
      alle Klone neu geklont werden. Siehe Umsetzungsplan §2/WP-1.8.
- [ ] E2E-Specs sind veraltet und testen stillgelegte Seiten/Endpunkte
      (`tests/pilot-survey.spec.ts`, `tests/variant-switch.spec.ts`,
      `tests/study2-integration.spec.ts`, Pfade `/pilot`/`/quiz` in
      `tests/responsive.spec.ts`, `/api/pilot/submit` und `/api/admin/questions`
      in `tests/api-validation.spec.ts`) → aufräumen mit Umsetzungsplan WP-5.2.
- [ ] **Lint-Warnungen seit Next 16 (WP-3.2):** `react-hooks/set-state-in-effect`
      in `AttributeChecklist.tsx` und `GroupSelfRatingQuiz.tsx` (Vorbelegung aus
      geladenen Daten → besser beim Laden statt im Effect setzen) und
      `react-hooks/preserve-manual-memoization` in `DemoTour.tsx` (fällt mit der
      Demo in Phase 5 weg). Danach beide Regeln in `eslint.config.mjs` wieder
      auf `error`.
- [ ] Startseite der Root-App (`src/app/[locale]/(public)/page.tsx`) ist auch unter
      `/en` deutsch (fest eingebaute Texte) — klären, ob sie mit Phase 5 überhaupt
      bleibt; sonst Texte nach `messages/*.json`.

---

## Erledigt / Verworfen (Kurzchronik)

- ✅ **Juli 2026:** Statische Seite live (www.fomo-dresden.app); Merge
  `static_alternative` (EN-Routen, Redesign); SEO komplett (Sitemap, hreflang,
  JSON-LD, Kategorieseiten); Impressum/Datenschutz auf Victor Kling;
  Umami-Instrumentierung inkl. voller Antwortvektoren + `pick`-Payloads
  (Nutzer-Entscheidung, dokumentiert in DATEN-SAMMELN-KONZEPT.md);
  Report-Generator + `/report/` + GitHub-Actions; Audits (Launch, Runtime,
  Bias) mit Fixes (verified-only Matching, faire Gleichstand-Anzeige, Suche
  auf /groups, „Antworten ändern", Sprachumschalter überall); Google-Sheets-
  Anbindung revertiert; Datenexport 41 verifizierte Gruppen.
- ✅ **Mai–Juni 2026:** Working Set v2 (21 Items + 8 Filter); V2-Integration
  (GroupSelfRating in der Root-App); Algorithmus-Fixes (Pläne im Archiv:
  `CLAUDE-pläne/archiv/`).
- ❌ **Studie 2** (Mitglieder-Validierung über `/pilot`): verworfen wegen zu
  wenig Rücklauf. Ersatz: anonyme Live-Daten + passiver Selbsterkennungs-Test
  auf der Ergebnisseite (`self-recognition`-Event).
- ✅ **Phase 1** (Pilot-Umfrage, Mai 2026): Classic-Variante gewinnt,
  Working Set v1.1 → abgelöst durch v2.

---

## Wo welche Doku liegt (Spickzettel)

| Thema | Datei |
|---|---|
| Projektkontext, Architektur-Regeln, Design | `CLAUDE.md` (Root) |
| Statische Seite: Build, Daten-Pipeline, SEO, Analytics | `static-site/README.md` |
| Betrieb ohne Programmierkenntnisse (Übergabe) | `static-site/docs/BETRIEBSHANDBUCH.md` |
| Welche Daten wir sammeln + warum (Umami) | `static-site/docs/DATEN-SAMMELN-KONZEPT.md` |
| Mit einer KI am Code arbeiten (für Externe) | `static-site/docs/KI-MITARBEIT.md` |
| Self-Hosting auf Uni-Server (Alternative zu Vercel) | `static-site/docs/INBETRIEBNAHME.md` |
| Scraper-Pipeline (Daten-Refresh ohne Prod-DB) | `static-site/docs/SCRAPING-KONZEPT.md` |
| Historische Pläne (abgeschlossen) | `CLAUDE-pläne/archiv/` |
