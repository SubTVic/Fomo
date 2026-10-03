# FOMO – Offene Aufgaben

**Stand: 3. Oktober 2026** (Status-Tabelle + Audit Okt. 2026 in §0; einzelne Abschnitte unten älter) — die
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
| Datenstand | 51 verifiziert / 44 unbestätigt / 95 gesamt (Export vom 17.08. — **seit 7 Wochen nicht aktualisiert**) |
| Umami-Tracking + Live-Report `/report/` | ✅ Läuft mit echten Daten (Env-Vars in Vercel gesetzt, 11.07.) |
| Dynamische Root-App (Registrierung/Admin) | 🔄 Internes Tool; Build, Admin-Schutz, Formular repariert (Plan Phase 1), Altlasten-Entfernung folgt (Phase 5) |
| Qualitäts-Netz | ✅ CI auf jedem PR, Datenprüfung vor jedem Build, Tests, KI-Leitplanken (Plan Phase 2) |
| Studie 2 (Mitglieder-Validierung) | ❌ Verworfen — ersetzt durch anonyme Live-Daten (Umami) |
| Erstiwoche September 2026 | ✅ vorbei — jetzt: Erstiwochen-Daten auswerten (§2) |
| Nächster Meilenstein | Datenpflege reparieren (Plan Phase 4); Next.js 16 + Node 24 erledigt (Phase 3) |

---

## §0 Audit Oktober 2026 — Ergebnis

Kompletter Audit (Build, Daten, Laufzeit-Crawl aller 208 Seiten bei 375px,
Quiz-Durchläufe DE/EN mit Analytics-Mock, SEO, Sicherheit, Root-App, Doku).

**Direkt behoben (im Audit-Commit):**

- 7 Gruppen-Links ohne `https://` (z. B. „tud.vote", Instagram-Handle
  „aiasdresden") wurden als *relative* Links gerendert → 404 auf
  Detailseite + Ergebnisliste. Daten in `groups.json` repariert; künftige
  Exporte normalisiert der Daten-Sync (`src/lib/export/static-groups.ts`),
  und `validate-data.mjs` bricht bei nicht-absoluten Links verifizierter
  Gruppen ab (die Übergangsliste `KNOWN_BAD_URLS` ist damit entfernt).
- Mindestregel aus CLAUDE.md (≥ 5 nicht-neutrale Antworten) fehlte: Nur
  „Neutral" ergab 10 Gruppen alle auf „Platz 1 / 50 %", 2 Antworten schon
  „100 %". Jetzt Hinweis + „Antworten ändern" statt Schein-Ranking (neues
  Event `results-too-few-answers`).
- „Antworten ändern" zählte jeden zweiten Durchlauf erneut als
  `quiz-complete`/`quiz-response`/`quiz-item-view` → Report-n aufgebläht.
  Jetzt einmal pro Durchlauf. **Achtung bei Auswertung:** Daten vor dem
  3.10. enthalten diese Doppelzählungen (Abschlüsse > Starts möglich).
- Mobile Overflow: H1 „Datenschutzerklärung" (102px) und Karten auf
  `/groups/kategorie/wirtschaft-karriere/` (3px).
- Next.js-/next-auth-Sicherheitsupdates, kaputter Root-App-Build und
  Validator-Rauschen („categoryColor missing") — im Audit gefixt, inzwischen
  durch den Umbau (PR #3: Next 16, Node 24, neue Datenprüfung) ersetzt.
- Report-Workflow: Eingabe `days` nicht mehr direkt in die Shell
  interpoliert.

**Offen aus dem Audit → in §1/§2/§3 unten einsortiert** (markiert mit „Audit 10/26").

---

## §1 Admin-Aufgaben (kein Code) — Reihenfolge = Wirkung pro Aufwand

### 1.0 Vercel prüfen: Registrierungs-App deployt wieder? (5 Min) — Audit 10/26

Der Root-Build war auf `main` kaputt (s. §0). Nach dem Merge im Vercel-
Dashboard des **Root-Projekts** (fomo-pi.vercel.app) prüfen, dass der neue
Deploy grün ist, und nachsehen, seit wann Deploys fehlgeschlagen sind. Dabei
gleich prüfen: Ist in der Produktions-DB noch der Seed-Admin
`admin@fomo.dev` mit dem Dev-Passwort aus `prisma/seed.ts` aktiv? Falls ja:
löschen oder Passwort ändern (das Passwort steht öffentlich im Repo).

### 1.1 Drei doppelte Gruppen bereinigen (15 Min) — sichtbar im Live-Report!

**Audit 10/26: immer noch offen** (Export 17.08.) — Rotaract erscheint im
Quiz-Ergebnis weiterhin **zweimal in derselben Liste** (im Audit reproduziert).
TURAG ist inzwischen erledigt; Rotaract + kritmed nicht.

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

### 1.2 Zehn Gruppen ohne Aktivitäts-Filter (E-Mail-Runde) — größter Bias-Hebel

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
| PAUL Consultants e.V. *(neu seit Export 17.08.)* | vorstand@paul-consultants.de |

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

- [ ] **Datenschutzerklärung ergänzen (Audit 10/26):** Umami wird als
      Reichweitenmessung beschrieben, aber der **Anbieter/Empfänger** (Umami
      Cloud, Script von `cloud.umami.is`, Serverstandort/AV-Vertrag) ist nicht
      genannt — Art. 13 DSGVO verlangt die Empfänger. Text unter
      `static-site/src/app/datenschutz/page.tsx`, danach „Stand" aktualisieren.
      Juristisch prüfen lassen (im Code steht noch ein PLACEHOLDER-Kommentar).

- [ ] **Google Search Console:** Domain verifizieren + Sitemap
      `https://www.fomo-dresden.app/sitemap.xml` einreichen.
- [ ] **Uptime-Monitor** (z. B. UptimeRobot, kostenlos) auf
      www.fomo-dresden.app → mailt bei Ausfall.

### 1.6 Datenpflege-Kampagne (laufend) — der eigentliche Qualitäts-Hebel

- **Daten-Export aktualisieren:** letzter Export 17.08. — vor jeder Auswertung
  neu exportieren, sonst fehlen Registrierungen aus der Erstiwoche.
- **Mehr Registrierungen:** 51 von 95 verifiziert (Stand 17.08.). Jede weitere verbessert
  das Matching mehr als jede Code-Änderung — wichtigster Hebel vor der
  Erstiwoche.
- **Kategorien:** 55 von 95 Gruppen stehen in „Sonstiges" (11 davon verifiziert);
  „Glaube & Spiritualität" hat noch keine Kategoriefarbe (Badge grau) — jede Zuordnung
  füllt eine SEO-Kategorieseite und macht den Browse-Filter nützlich.
- **Logos:** nur 13 vorhanden; Mitgliederzahlen: 38; „Nächstes Event": 0.
  Ohne Kontaktweg: `christians-for-mission`; ohne Langbeschreibung:
  Bits & Bäume, RCDS. `logos.json` zeigt noch auf den gelöschten Slug
  `tu-dresden-robotik-ag-turag` (harmlos, kann raus).
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
- [ ] **Kontraste (Audit 10/26, Barrierefreiheit):** `text-muted` (#7a9aaa)
      auf Weiß = 2,99:1, `text-body` (#5a7a8a) auf Hellblau = 3,0:1,
      `accent-muted` auf Weiß = 3,79:1 — WCAG AA verlangt 4,5:1 für
      Fließtext. Betrifft Hinweise, Kategorie-Labels, „Profil öffnen →".
      Design-Entscheidung (Farbschema in CLAUDE.md) — Vorschlag: Muted-Töne
      um ~20 % abdunkeln.
- [ ] **Tests/CI (Audit 10/26):** `static-site/` hat keine Tests und kein
      CI-Gate außer dem Vercel-Build. Vorschlag: Vitest für `matching.ts`/
      `results.ts` + GitHub-Action (build + validate) auf PRs. In der Root-App
      sammelt `vitest` fälschlich die Playwright-Specs in `tests/` ein (6
      „failed" Dateien, die eigentlichen 7 Unit-Tests sind grün) →
      `include`/`exclude` in der Vitest-Config setzen.
- [ ] **EN-Seitentitel (Audit 10/26, SEO, klein):** Gruppen-Detailseiten DE
      und EN haben identische `<title>` („Name — FOMO"); EN-Titel um z. B.
      „student group at TU Dresden" ergänzen.
- [ ] **Rang-Definition vereinheitlichen (Audit 10/26, klein):**
      `group-click`/`pick` nutzt den angezeigten Rang (punktgleiche teilen
      sich einen Rang), `self-recognition` die Listenposition. Für die
      Report-Analyse eine Definition wählen.
- [ ] **Working-Set v3** (nach der Erstiwoche, wenn n groß genug): Die
      Item-Diagnose im `/report/` markiert aktuell 4 Streichkandidaten
      (einseitige Items, u. a. „Hands-on" 77 % Zustimmung, „Einsteiger" 73 %).
      Bei n=26 noch nicht entscheidungsreif — mit Erstiwochen-Daten neu bewerten.
- [ ] **Gamification-Backlog:** Ergebnis-Reveal,
      Persönlichkeits-Profil, Badges, Share-Cards, Leaderboard — erst nach
      der Erstiwoche, wenn Daten da sind.
- [ ] **Lint-Warnungen `react-hooks/set-state-in-effect` abbauen** (seit Next 16,
      WP-3.1): `BackLink`, `Navbar`, `QuizFlow` lesen `window.location` erst nach
      dem Laden (z. B. auf `useSyncExternalStore` umstellen); `ItemScreen` und
      `ResultsScreen` setzen Animations-State im Effect zurück (besser per `key`
      bzw. im Klick-Handler). Danach die Regel in `eslint.config.mjs` wieder auf
      `error` stellen. Verhalten mit dem Quiz-Durchlauf (375 px) gegenprüfen.
- [ ] **Kategorieseiten: Überschrift bricht mitten im Wort** (375 px): „HOCHSCHULGRUPPEN“
      ist in Archivo Black `text-3xl` breiter als die Spalte und bricht ohne
      Trennstrich („HOCHSCHULGRUPP / EN“). Betrifft alle `/groups/kategorie/*`.
      Lösung z. B. `text-2xl sm:text-4xl` oder `&shy;` in den SEO-Titeln
      (`data/categories.json`). Gefunden bei WP-4.6.
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
- [ ] **Lint-Warnung seit Next 16 (WP-3.2):** `react-hooks/set-state-in-effect`
      in `GroupSelfRatingQuiz.tsx` (Vorbelegung aus geladenen Daten → besser beim
      Laden statt im Effect setzen). Danach die Regel in `eslint.config.mjs`
      wieder auf `error`.
- [ ] 🧑 **Löschkonzept abstimmen** (`docs/datenschutz-loeschkonzept.md`): Fristen mit dem
      StuRa klären (Kontakte, Änderungsprotokoll, Backups, inaktive Gruppen) und bis zum
      Server-Umzug `scripts/cleanup.ts --apply` regelmäßig von Hand ausführen lassen.
- [ ] Altdaten in `data/` prüfen (seit WP-5.2 von keinem Code mehr gelesen):
      `hg_MERGED.csv`, `study2-plan.md`, `group-verification-deploy-checklist.md`,
      `Pictures/`; dazu `scripts/generate-invites.ts` (einmaliger Einladungs-Export
      von 2026, erzeugt Alt-Einmallinks). Archivieren oder löschen.
- [ ] `shadcn` und `tw-animate-css` werden nur noch über `src/app/globals.css`
      importiert (keine shadcn-Komponenten mehr) — prüfen, ob die CSS-Importe
      und `components.json` wegkönnen, ohne das Aussehen zu ändern.
- [ ] Rest-Advisories (Audit 10/26): `prisma` 6 → zieht `effect`/
      `deepmerge-ts` (nur Build-CLI, nicht zur Laufzeit) und Next bündelt ein
      altes `postcss` (nur Build). Beim nächsten Prisma-/Next-Major mitnehmen.
- [ ] Rate-Limit ist In-Memory (`src/lib/rate-limit.ts`) — auf Vercel pro
      Serverless-Instanz, also nur ein schwacher Spam-Schutz für
      `/api/groups/register`. Reicht bei aktuellem Traffic; bei Spam auf
      Vercel-Firewall/Upstash umstellen.
- [ ] Optional: EN-Übersetzungen für Quiz-Thesen im Admin nachtragen.

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
