# FOMO – Offene Aufgaben

**Stand: 12. Juli 2026** — die **eine zentrale To-do-Datei** des Projekts.
(Hier ist `static-site/docs/AUFGABEN-NACH-AUDIT.md` aufgegangen; die alte
Phasen-To-do von Mai 2026 ist unten unter „Erledigt/Verworfen" archiviert.)

Kontext zum Projekt: `CLAUDE.md` (Root). Betrieb ohne Programmierkenntnisse:
`static-site/docs/BETRIEBSHANDBUCH.md`.

---

## Status-Überblick

| Bereich | Status |
| --- | --- |
| **Öffentliche Seite** `static-site/` | ✅ **Live auf www.fomo-dresden.app** (Vercel, deployt bei jedem Push auf `main`) |
| Matching v2 (21 Items + 8 Filter, client-side) | ✅ Live — nur verifizierte Gruppen im Quiz |
| Datenstand | 41 verifiziert / 52 unbestätigt / 93 gesamt (Export vom 11.07.) |
| Umami-Tracking + Live-Report `/report/` | ✅ Läuft mit echten Daten (Env-Vars in Vercel gesetzt, 11.07.) |
| Dynamische Root-App (Registrierung/Admin) | 🔄 Internes Datenerfassungs-Tool, läuft weiter |
| Studie 2 (Mitglieder-Validierung) | ❌ Verworfen — ersetzt durch anonyme Live-Daten (Umami) |
| Nächster Meilenstein | **Erstiwoche September 2026** = Haupt-Traffic |

---

## §1 Admin-Aufgaben (kein Code) — Reihenfolge = Wirkung pro Aufwand

### 1.1 Drei doppelte Gruppen bereinigen (15 Min) — sichtbar im Live-Report!

Im Live-Report taucht **Rotaract Club Dresden zweimal** in „Meistgeklickte
Gruppen" auf — die Duplikate klauen sich gegenseitig Klicks und Rankings.
In der **Admin-App** (dynamische Root-App) je **eine** Kopie deaktivieren,
dann neu exportieren (`node scripts/export-from-backup.mjs --backup …` in
`static-site/`, `groups.json` committen).

| Behalten ✅ | Deaktivieren ❌ | Warum |
|---|---|---|
| `rotaract-club-dresden` (dresden-vorstand@rotaract.de) | `rotaract-club-dresden-2` (felix.a.mack@…) | **Wichtigster Fall: beide verifiziert, konkurrieren im Quiz.** Offizielle Vorstands-Mail behalten. Im Zweifel Rotaract fragen, welche Anmeldung die „echte" ist. |
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
- [ ] **Gamification-Backlog** (siehe CLAUDE.md): Ergebnis-Reveal,
      Persönlichkeits-Profil, Badges, Share-Cards, Leaderboard — erst nach
      der Erstiwoche, wenn Daten da sind.

---

## §3 Dynamische Root-App (internes Tool)

Die Root-App bleibt Datenerfassungs-Tool (Registrierung + Admin). Offen:

- [ ] Gruppen-Invite-Links generieren + mailen → Ziel: möglichst viele
      `GroupSelfRating`-Registrierungen vor der Erstiwoche (siehe §1.6).
- [ ] Duplikate deaktivieren (siehe §1.1) — passiert in dieser App.
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
