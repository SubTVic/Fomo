# FOMO — Algorithmus-Fixes Plan (Sonnet vs. Opus)

> **Stand:** 04. Mai 2026
> **Zielgruppe:** Claude Code, mit klarer Modell-Empfehlung pro Task
> **Ablageort:** `CLAUDE-pläne/ALGORITHM-FIXES.md`
> **Vorgänger-Plan:** `PHASE2-PLAN.md` (Phase 2 läuft, dies ist Verfeinerung)
> **Auslöser:** Algorithmus-Kontextdatei vom 04.05.2026 — Self-Recognition Top-3 = 20 %, mehrere Item↔Attribut-Mapping-Probleme

---

## Modell-Wahl-Logik

**Sonnet 4.6 reicht für:**
- Klar spezifizierte Code-Änderungen (Bug-Fixes mit gegebener Formel)
- JSON-Schema-Updates und Migration-Skripte
- Tests schreiben gegen klare Specs
- Daten-Auswertungs-Skripte mit definiertem Output
- Re-Scrape-Pipeline-Anpassungen
- Routine-Refactoring

**Opus 4.7 nehmen wenn:**
- Item-Konstruktion mit psychometrischer Sensibilität (Bias, Wording, Verständlichkeit)
- Architektur-Entscheidungen mit Trade-offs
- Konstrukt-Definitionen schärfen (semantische Klarheit über mehrere Stakeholder hinweg)
- Mehrdeutige Probleme, wo "richtig" nicht eindeutig ist
- Audit-Reviews über große Codeflächen mit qualitativem Urteil

**Faustregel:** Wenn der Plan-Eintrag eine vollständige Spezifikation (Input, Output, Akzeptanzkriterien) hat → Sonnet. Wenn der Eintrag Worte wie *entscheiden, abwägen, formulieren, designen* enthält → Opus.

In diesem Plan ist die Vorarbeit überall so weit gemacht, dass die meisten Tasks Sonnet-fähig sind. Drei Punkte (B1-Definitionen, C1-Item-Texte, D3-Interpretation) bleiben Opus-Empfehlung — die markiere ich klar.

---

## Tracks im Überblick

| Track | Inhalt | Modell | Reihenfolge |
|---|---|---|---|
| A | Algorithmische Bug-Fixes | Sonnet | sofort, parallel zu B |
| B | Daten-Schema schärfen + Re-Scrape | B1 Opus, B2-B3 Sonnet | nach A1 |
| C | Working Set v2 | C1 Opus, C2-C3 Sonnet | nach B abgeschlossen |
| D | Empirische Validierung | D1-D2 Sonnet, D3 Opus | parallel zu C |
| E | Group-Verifikation deployen | Sonnet | parallel, eigener Track |

---

## TRACK A — Algorithmische Bug-Fixes (Sonnet)

### A1 — Multi-Item-Normalisierung in `matching.ts`

> **Status: ✅ Implementiert — 2026-05-05 · Commit `938dd9f`**

**Problem:** Wenn 3 Items auf `socialImpact` mappen, geht dieses Attribut 3× in den Score ein. Das ist nicht intendiert und überdimensioniert socialImpact, ohne dass der attributeWeight-Mechanismus das ausgleicht.

**Fix-Spec:**
- Vor der Score-Berechnung: Anzahl der Items pro Attribut zählen
- Im `effWeight`-Term: durch diese Anzahl teilen
- Mathematisch: `effWeight_i = userWeight_i × attributeWeight_attr × (1 / itemCount_attr)`

**Implementierung:**

- Neue Hilfsfunktion `computeItemCountsPerAttribute(theses)` in `src/lib/quiz/matching.ts`
- `effectiveWeight` wird durch `itemCounts[mapping.attribute]` dividiert
- Inline-Kopie in `scripts/validation/self-recognition-test.ts` synchron gehalten
- 7 Unit-Tests in `src/lib/quiz/__tests__/matching.test.ts`

**Akzeptanz:**

- [x] Test vorhanden, grün (7/7)
- [ ] Self-Recognition-Test (D2) wird nach diesem Fix neu laufen — Erwartung: Top-3-Rate steigt um mindestens 5 Prozentpunkte (von 20 % auf ≥ 25 %), weil socialImpact nicht mehr triple-zählt

---

### A2 — Vier Mapping-Korrekturen

> **Status: ✅ Implementiert — 2026-05-05 · Commit `f4f2ecd`**

**Vorgabe (von außen entschieden, Sonnet setzt nur um):**

| ID | bisheriges Mapping | NEU |
|---|---|---|
| WS-D9Q5 "Präsenz vor Ort" | `tech (inv)` | **ENTFERNEN aus Working Set v1** — wird in C ersetzt |
| WS-D3Q4 "Große Gruppe" | `networking` | **WORDING ÄNDERN** — siehe unten |
| WS-D6Q4 "Gemeinsame Werte" | `religion` | **AUS WORKING SET V1 ENTFERNEN** — wird in C ersetzt |
| WS-D4Q3 "Hochschulpolitik" | `party` | **NEUES MAPPING:** `politicalActivism` — siehe Track B |

WS-D3Q4 neue Formulierung (so dass es networking auch wirklich misst): "Ich suche eine Gruppe, in der ich viele neue Leute aus verschiedenen Bereichen kennenlernen kann."

**Sonnet-Prompt:**
```
Implementiere Track A2 in src/data/working-set-v1.json (oder
äquivalentem Pfad):

1. Entferne WS-D9Q5 (wird durch neues Item in v2 ersetzt)
2. Entferne WS-D6Q4 (wird durch neues Item in v2 ersetzt)
3. Ändere Wording von WS-D3Q4 zu:
   "Ich suche eine Gruppe, in der ich viele neue Leute aus
    verschiedenen Bereichen kennenlernen kann."
   Mapping bleibt networking.
4. Lass Mapping von WS-D4Q3 vorerst auf "party" — wird in
   Track B endgültig auf "politicalActivism" geändert nachdem
   das Schema aktualisiert ist.

Erstelle einen kleinen Migrationshinweis in der Commit-Message:
"Working Set v1.1: 2 Items entfernt, D3Q4 reformuliert".
```

**Akzeptanz:**

- [x] Live-Quiz hat 17 Items (von 19 auf 17 reduziert) — temporär, bis v2 fertig
- [x] WS-D3Q4 zeigt neues Wording

---

## TRACK B — Daten-Schema schärfen + Re-Scrape

### B1 — Schärfere Attribut-Definitionen (**OPUS**)

**Warum Opus:** Hier geht es um semantische Präzision, die das Scraper-Modell beim nächsten Run interpretieren muss. Schwammige Definitionen produzieren wieder schwammige Daten. Außerdem: Aufspaltung des `party`-Attributs (Feier vs. politische Partei) ist eine Konstrukt-Entscheidung mit Folgewirkung auf das Item-Mapping.

**Opus-Diskussionspunkte (mit Victor zu klären):**

1. **`leadershipOpportunities` schärfen.** Aktuell 83/83 = true. Vorschlag: "Die Gruppe hat formelle Vorstands-, Leitungs- oder Projektleiter-Rollen, in die Mitglieder über Wahl oder Bewerbung hineinwachsen können." → ausschließend für Gruppen ohne formale Hierarchie.

2. **`beginnerFriendly` schärfen.** Aktuell 82/83 = true. Vorschlag: "Die Gruppe nimmt aktiv ohne Vorerfahrung, ohne Vorauswahl und ohne Bewerbungsverfahren auf." → YETI z.B. wäre dann false.

3. **`party` aufspalten in zwei Attribute:**
   - `socialEvents`: "Die Gruppe veranstaltet regelmäßig Feiern, Studiclub-Events oder informelle Geselligkeit als zentralen Teil ihrer Aktivität."
   - `politicalActivism`: "Die Gruppe engagiert sich aktiv für politische Ziele, Kampagnen oder Hochschulpolitik (StuRa, Parteijugend, Aktivismus)."
   
   Konsequenz: Das Schema hat dann 18 Attribute (eins mehr). WS-D4Q3 mappt sauber auf `politicalActivism`.

4. **`socialImpact` aufteilen?** Aktuell 71/83 = true → kaum diskriminativ. Möglichkeiten:
   - Lassen wie es ist und akzeptieren, dass es ein Hintergrundsignal ist
   - Aufspalten in `charity`/`sustainability`/`politicalActivism` — aber `politicalActivism` hätten wir dann doppelt
   - Schärfen: "Die Gruppe hat einen *primären* Fokus auf gesellschaftliche oder soziale Themen (nicht nur als Nebenaspekt)." → reduziert die 71 auf vermutlich 30-40
   
   **Empfehlung für Opus-Diskussion:** Schärfen der Definition (Variante 3) ist der pragmatischste Weg. Aufspaltung verkompliziert das Mapping.

**Workflow:**
1. Diskussion in Opus-Session mit Victor → finale Definitionen
2. Update von `data/group-attributes-schema.json`
3. Übergabe an Track B2 für Re-Scrape

**Output:** Aktualisiertes `group-attributes-schema.json` mit neuen Definitionen.

---

### B2 — Selektiver Re-Scrape (Sonnet)

**Voraussetzung:** B1 abgeschlossen.

**Sonnet-Prompt:**
```
Lies scripts/scraper/ und data/group-attributes-schema.json.

Implementiere einen selektiven Re-Scrape-Modus:
- Argument --attributes leadership,beginnerFriendly,party,socialImpact
  (oder welche immer in B1 geändert wurden)
- Lädt vorhandenes data/hsg-profiles-scraped.json
- Re-scrapt für jede der 83 Gruppen NUR die genannten Attribute
- Andere Attribute bleiben unverändert
- scrapedAt + scrapedFrom + confidence werden für die geänderten
  Attribute aktualisiert

Vor Vollrun: Trockenlauf mit 5 Gruppen (Elbflorace, IHD, SMD, YETI,
bonding). Manuelle Verifikation, dann Vollrun.

Erstelle danach einen Diff-Report:
data/scrape-diffs-2026-XX-XX.md
mit: Pro Attribut wie viele Gruppen sich von true→false oder umgekehrt
geändert haben + 5 stichprobenartige Beispiele.
```

**Akzeptanz:**
- [ ] Trockenlauf erfolgreich, sinnvolle Klassifikation
- [ ] Vollrun produziert aktualisierte Profile
- [ ] Diff-Report zeigt deutliche Veränderung bei `leadershipOpportunities` und `beginnerFriendly` (nicht mehr 83/83 bzw. 82/83)
- [ ] Wenn `party` aufgespalten wurde: neue Felder `socialEvents` und `politicalActivism` in allen Profilen

---

### B3 — Schema-Versionierung (Sonnet)

**Sonnet-Prompt:**
```
Bei Schema-Änderungen in B1: bumpe die Version in
data/group-attributes-schema.json von 1 auf 2.

Erstelle data/SCHEMA-CHANGELOG.md (oder ergänze, falls vorhanden) mit:
- Datum
- Welche Attribute neu, geändert, entfernt
- Migrations-Notiz (was passiert mit alten Daten?)

Stelle sicher, dass src/lib/quiz/matching.ts gegen das neue Schema
robust ist (nicht crasht wenn ein altes Profil ein neues Attribut
nicht hat — Default false).
```

---

## TRACK C — Working Set v2

### C1 — Vier neue Items konstruieren (**OPUS**)

**Warum Opus:** Item-Konstruktion ist der heikelste Punkt. Schlechte Wording erzeugt Bias, Deckeneffekte oder Mehrdeutigkeit. Die Pilot-Lehre (D10-Konstrukt-Konflikt) zeigt, wie schnell ein scheinbar logisches Item versagt. Diese 4 Items werden ohne Pilot-Welle direkt live gehen — also Maximum-Sorgfalt.

**Vorarbeit (von mir, als Diskussionsgrundlage für Opus-Session):**

| Attribut | Vorschlag-Wording | Bias-Risiko | Mapping |
|---|---|---|---|
| `career` | "Ich möchte in der Hochschulgruppe gezielt für meinen Berufseinstieg arbeiten — z. B. durch Praxiserfahrung, Kontakte zu Unternehmen oder Bewerbungstraining." | Konkrete Beispiele machen es greifbar; gegen *Networking*-Frage abgrenzen | `career`, nicht-invers |
| `financialCost` | "Mitgliedsbeiträge oder Materialkosten würden mich nicht von einer ansonsten passenden Gruppe abhalten." | Bewusst bipolar formuliert, vermeidet Boden-/Deckeneffekt; misst Toleranz, nicht Wunsch | `financialCost`, nicht-invers |
| `music` | "Ich möchte in der Gruppe aktiv Musik machen — z. B. singen, ein Instrument spielen oder produzieren." | Klar, konkret. Niedriges Bias-Risiko. | `music`, nicht-invers |
| `sports` | "Sportliche Aktivität ist ein zentraler Bestandteil meiner Wunsch-Gruppe." | Niedrigste Priorität (Gewicht 0.24). Optional. | `sports`, nicht-invers |
| **Ersatz für Tech (war WS-D9Q5)** | "Ich möchte in der Gruppe mit Technologie und digitalen Tools arbeiten — z. B. Programmierung, Hardware, KI, Daten." | Direkter Tech-Bezug, nicht Online/Offline-Verwechslung | `tech`, nicht-invers |
| **Ersatz für Werte (war WS-D6Q4)** | siehe Diskussion unten |

**Diskussionspunkt für Opus-Session zu WS-D6Q4-Ersatz:**
- Variante A: Religion-Item direkt: "Ich möchte mich mit Menschen meines Glaubens oder meiner Weltanschauung in einer Gruppe austauschen." → `religion`, deckt nur 8 Gruppen — niedriges Gewicht (0.19), aber wahrscheinlich genau dann sehr wichtig wenn relevant
- Variante B: Kein Religions-Item, stattdessen ein zweites politisch-werteorientiertes Item
- Variante C: Item streichen, durch direktes Tech-Item ersetzen, dann einer der 4 anderen Slots frei für etwas anderes

**Opus-Prompt-Vorlage:**
```
Wir designen Working Set v2 von FOMO. Lies:
- CLAUDE-pläne/ALGORITHM-FIXES.md (insbesondere Track C1)
- data/group-attributes-schema.json (Stand nach Track B)
- data/hsg-profiles-scraped.json (für Verteilungs-Bewusstsein)

Aufgabe: Finalisiere die Item-Texte für die 6 neuen/ersetzten Items.

Pro Item gib aus:
1. Item-Text (deutsch, max 25 Wörter)
2. Mapping (Attribut, invers ja/nein)
3. Begründung der Wording-Wahl
4. Erwartetes Antwortverhalten in 3 Beispielgruppen
5. Bias-Risiken und wie sie adressiert sind

Ich (Victor) entscheide am Ende über Annahme. Sei kritisch mit deinen
eigenen Vorschlägen.
```

**Output:** Finale Item-Texte plus eine Markdown-Datei `data/working-set-v2-design-notes.md` mit Begründungen.

---

### C2 — Working Set v2 JSON erstellen (Sonnet)

**Voraussetzung:** C1 abgeschlossen.

**Sonnet-Prompt:**
```
Erstelle data/working-set-v2.json basierend auf Item-Texten aus
data/working-set-v2-design-notes.md (von C1).

Struktur soll identisch zu working-set-v1.json sein. Felder:
- id (z.B. "WS-V2-CAREER")
- text (de)
- attribute (gemäß aktuellem Schema)
- isInverse (boolean)
- pilotValidated (boolean) — true für unveränderte Items aus v1,
  false für neue
- source (z.B. "pilot-2026-04" oder "v2-design-2026-05")

Items im Working Set v2:
- 13-15 Items aus v1, die unverändert bleiben (die mit klarem Mapping)
- 6 neue/ersetzte Items aus C1

Erstelle parallel data/working-set-v1-to-v2-migration.md mit:
- Welche v1-Items entfernt
- Welche v1-Items unverändert übernommen
- Welche v2-Items neu

Aktualisiere src/config/quiz.ts (oder äquivalent), so dass das Live-
Quiz auf v2 zeigt. v1 bleibt im Repo als Archiv.
```

**Akzeptanz:**
- [ ] `working-set-v2.json` ist valide gegen das Quiz-Schema
- [ ] Live-Quiz zeigt 19-21 Items (final festgelegt in C1)
- [ ] Migration-Doc dokumentiert die Änderungen

---

### C3 — Pilot-Antworten gegen v2 mappen (Sonnet)

**Begründung:** Wir haben 67 Pilot-Antworten zu Items, von denen viele in v2 unverändert sind. Diese Antworten können wir wiederverwenden, um den Self-Recognition-Test mit dem v2-Quiz zu simulieren — *ohne* eine neue Pilot-Welle.

**Sonnet-Prompt:**
```
Schreibe scripts/validation/simulate-v2-from-pilot.ts:

1. Lädt archives/pilot-responses-2026-05-04.json
2. Filtert auf Sessions mit Free-Text-Group-Membership
3. Pro Session: konstruiere v2-Antworten:
   - Für unveränderte v2-Items: nimm die Pilot-Antwort
   - Für neue v2-Items (nicht im Pilot): markiere als missing
4. Lass den Matching-Algorithmus mit diesen partiellen Antworten
   laufen (Algorithmus muss mit fehlenden Items umgehen können —
   wenn nicht, das ist ein zusätzlicher Bug)
5. Berichte Top-1/3/10-Hit-Rates
6. Vergleiche mit dem v1-Ergebnis (20% Top-3) — quantifiziere
   den Unterschied

Output: Markdown-Report data/v2-simulation-report.md
```

**Erwartetes Ergebnis:** Top-3 zwischen 25 % und 40 %. Wenn höher → großartig. Wenn niedrig → Track D3 dringender.

---

## TRACK D — Empirische Validierung

### D1 — Item-Validität gegen Pilot-Group-Membership (Sonnet)

> **Status: ✅ Implementiert — 2026-05-05 · Commit `0f9283a`**

**Was wir prüfen:** Pro v1-Item: Trennt es Mitglieder einer Gruppe X von Nicht-Mitgliedern? Das beantwortet die Frage "ist das Mapping empirisch sinnvoll" — *unabhängig* von der psychometrischen Reliabilität.

**Sonnet-Prompt:**
```
Schreibe scripts/validation/item-discrimination-analysis.ts:

Eingaben:
- archives/pilot-responses-2026-05-04.json (67 Sessions)
- data/hsg-profiles-scraped.json

Vorgehen:
1. Filtere auf Sessions mit isMember=yes oder was AND nicht-leerer
   groupNames (~24 Sessions)
2. Versuche, jede genannte Gruppe einer ID in hsg-profiles zu
   matchen (Fuzzy-Match auf name + manuelle Korrekturmappe in
   einer separaten JSON, falls Fuzzy nicht reicht)
3. Pro Item:
   - Mittelwert der Antworten von Mitgliedern aller Gruppen, die
     attribute=true haben
   - Mittelwert der Antworten von Mitgliedern aller Gruppen, die
     attribute=false haben
   - Differenz = Diskriminierungskraft des Items
   - Standardfehler / t-Test wenn Stichprobe es erlaubt
4. Sortiere Items nach Diskriminierungskraft

Output: data/item-empirical-validity-report.md
- Tabelle Items × Diskriminierungskraft
- Highlight: welche Items diskriminieren empirisch nicht (selbst
  wenn psychometrisch okay)
- Vorschlag pro problematischem Item: behalten / streichen /
  reformulieren

Ehrlicher Disclaimer im Report: n=24, sehr klein, alle Befunde
sind Hinweise nicht Belege.
```

**Ergebnis (n=10 auswertbare Sessions):**

| Urteil | Items |
| --- | --- |
| ✅ gut (Δ ≥ 0.15) | WS-D4Q3 (party, Δ=0.44), WS-D7Q3 (international, Δ=0.40), WS-D1Q1 (timeLow, Δ=0.30), WS-D2Q1 (handsOn, Δ=0.29), WS-D4Q4, WS-D2Q5, WS-D6Q3 |
| ⚠️ schwach (Δ < 0.15) | WS-D8Q3 (competitive, Δ=0.00), WS-D9Q4 (outdoor, Δ=0.00) |
| ❓ keine Daten | WS-D5Q5, WS-D1Q5, WS-D3Q1, WS-D3Q4, WS-D10-NEW, WS-S1, WS-S2, WS-S3 |

Voller Report: `data/item-empirical-validity-report.md`

**Aufwand:** ~1 Tag Sonnet-Implementierung. Wahrscheinlicher Output: 3-5 Items, die empirisch fragwürdig sind, auch nach v2-Reformulierung.

---

### D2 — Self-Recognition-Test wiederholen (Sonnet)

**Voraussetzung:** Track A (Bug-Fixes) UND mindestens Track B (verbesserte Profile) abgeschlossen. Ideal: auch C (Working Set v2).

**Sonnet-Prompt:**
```
Lass scripts/validation/self-recognition-test.ts erneut laufen mit:
- aktualisierten Group-Profiles aus B2
- gefixtem Algorithmus aus A1
- Working Set v2 aus C2 (wenn fertig)

Generiere zusätzlich pro Test-Session ein Diagnostik-Stück:
- Erwartete Gruppe vs. tatsächlicher Rang
- Top-5 Gruppen statt nur Hit-Rate
- Welche Items haben am meisten zur falschen Gruppe gezogen?

Update data/self-recognition-report.md mit Vergleich
v1-Ergebnis vs. neuestes Ergebnis.
```

**Schwellenwerte:**
- Top-3 ≥ 30 % nach A+B: Mindestziel
- Top-3 ≥ 40 % nach A+B+C: Sponsor-Demo-bereit
- Top-3 < 25 %: Vorgehen mit Victor neu evaluieren (Track D3)

---

### D3 — Interpretation und nächste Schritte (**OPUS**)

**Warum Opus:** Wenn die Self-Recognition-Rate auch nach Tracks A+B+C noch unter Schwellwert ist, brauchen wir qualitatives Urteil zur Ursache. Diagnostik aus D2 zeigt *Symptome*, aber Ursachen-Diagnose ist mehrdeutig:

- Sind die Group-Profile noch falsch (→ verschärfter Verifikations-Push)?
- Sind die Items doch noch nicht gut genug (→ weitere v2-Iteration)?
- Ist der Algorithmus selbst unzureichend (→ z. B. nicht-lineare Modelle)?
- Sind die ~30 Pilot-Mitglieder eine Sonderpopulation (→ Validierung mit Erstis abwarten)?

**Opus-Diskussionspunkt mit Victor:** Anhand des D2-Reports gemeinsam Ursachen priorisieren und nächste Iteration planen.

---

## TRACK E — Group-Verifikation deployen (Sonnet)

> **Status: ✅ Analyse + Checklist fertig — 2026-05-05 · Commit `06cb82e`**
> Deploy-Checklist: `data/group-verification-deploy-checklist.md`
> Nächster Schritt: Smoke-Test auf Staging + `APP_MODE=collect` in Vercel setzen (Victor)

**Status laut Algorithmus-Kontextdatei:** Token-System gebaut, aber nicht deployt.

**Begründung höchster Priorität:** Selbst der beste Algorithmus rankt gegen falsche Daten falsch. 0/83 verifiziert ist der größte einzelne Risikofaktor für die Sponsor-Demo.

**Sonnet-Prompt:**
```
Lies CLAUDE-pläne/PHASE2-PLAN.md §3 (Group Registration Flow) und
prüfe Status der Implementierung.

Fragen:
1. Was fehlt zum produktiven Deploy?
2. Welche Edge Cases sind ungetestet?
3. Wie wird APP_MODE umgeschaltet (collect → live)?
4. Funktioniert Token-Generierung end-to-end auf einer
   Staging-URL?

Output: data/group-verification-deploy-checklist.md mit
- Was deployed werden kann
- Was noch fehlt
- Smoke-Test-Plan: Token generieren → Link öffnen → Profil
  korrigieren → in DB landen → in nächstem Build sichtbar

Wenn alles deploy-bereit: deploye auf Staging, mache Smoke-Test
mit 2 Test-Tokens. Berichte.
```

**Parallel (NICHT Code, sondern Outreach-Aufgabe für Victor):**
- 30 Gruppen-Tokens generieren
- Personalisierte Mails an HSG-Kontakte mit Link
- Ziel: 30 verifizierte Profile in 4 Wochen
- Priorität: Gruppen mit niedriger Confidence im Scraper-Output

---

## Reihenfolge & Abhängigkeiten

```
Woche 1:
  ├── A1 Multi-Item-Normalisierung      [Sonnet] ✅ 2026-05-05
  ├── A2 Mapping-Korrekturen            [Sonnet] ✅ 2026-05-05
  ├── B1 Definitionen schärfen          [OPUS-Session mit Victor] ⏳ offen
  └── E  Group-Verifikation deployen    [Sonnet] ✅ Checklist 2026-05-05, Deploy ausstehend

Woche 2:
  ├── B2 Selektiver Re-Scrape           [Sonnet, nach B1]
  ├── B3 Schema-Versionierung           [Sonnet, nach B2]
  ├── D1 Item-Validitäts-Analyse        [Sonnet, parallel zu B] ✅ 2026-05-05
  └── C1 Working Set v2 Design          [OPUS-Session, nach D1] ⏳ offen

Woche 3:
  ├── C2 Working Set v2 JSON            [Sonnet, nach C1]
  ├── C3 v2-Simulation aus Pilot-Daten  [Sonnet, nach C2]
  └── D2 Self-Recognition Re-Test       [Sonnet, nach A+B+C]

Woche 4:
  ├── D3 Ergebnis-Interpretation        [OPUS-Session, nach D2]
  └── Sponsor-Demo Vorbereitung         [Mensch]
```

**Harte Blocker:**
- B1 → B2 → B3 (Definitionen vor Re-Scrape vor Schema-Update)
- C1 → C2 → C3 (Item-Design vor JSON vor Simulation)
- A+B+C → D2 (alle Fixes müssen drin sein für aussagekräftigen Re-Test)

**Kostenschätzung Modell-Nutzung:**
- Sonnet-Tasks: ~25-40 Stunden Arbeit, vorwiegend Routinecode → Sonnet 4.6 ausreichend, kostengünstig
- Opus-Tasks: 3 Sessions à 30-60 min mit Victor → vergleichsweise wenig Token-Volumen, aber qualitativ entscheidend
- B2 Vollrun-Scrape: ~3-4 € (wie Erstrun)

---

## Zusammenfassung pro Modell

### Sonnet 4.6 macht:

| ID | Task | Status |
| --- | --- | --- |
| A1 | Multi-Item-Normalisierung + Tests | ✅ 2026-05-05 |
| A2 | 4 Mapping-Korrekturen in JSON | ✅ 2026-05-05 |
| D1 | Item-Validitäts-Analyse | ✅ 2026-05-05 |
| E | Group-Verifikation Checklist | ✅ 2026-05-05 (Deploy Victor) |
| B2 | Selektiver Re-Scrape | ⏳ nach B1 |
| B3 | Schema-Versionierung | ⏳ nach B2 |
| C2 | Working Set v2 JSON erstellen | ⏳ nach C1 |
| C3 | Pilot→v2-Simulation | ⏳ nach C2 |
| D2 | Self-Recognition Re-Test | ⏳ nach A+B+C |

### Opus 4.7 macht:

| ID | Task | Aufwand |
|---|---|---|
| B1 | Attribut-Definitionen schärfen + `party`-Aufspaltung | 1 Session, 30-60 min |
| C1 | 4-6 neue Item-Texte mit Begründungen | 1 Session, 60-90 min |
| D3 | Ergebnis-Interpretation und nächste Schritte | 1 Session, 30-60 min, *nur falls D2 unter Schwellwert* |

### Was Mensch macht (kein Claude):
- Outreach an HSGs für Verifikation (Victor)
- Endgültige Item-Annahme nach Opus-Session C1 (Victor + ggf. Psychologin)
- Sponsor-Demo-Termine (Victor)

---

## Offene Punkte vor Start

1. **Item-Anzahl im finalen v2:** 19 oder 20? In §10 der Algorithmus-Kontextdatei wurde 19 vorgeschlagen. Wenn `sports` als 20. Item rein soll (niedriges Gewicht 0.24), wird es länger — aber besser abgedeckt. Entscheidung in C1-Session.

2. **`party`-Aufspaltung:** entscheidend für ein sauberes Mapping von WS-D4Q3. Falls Aufspaltung beschlossen, muss B3 das Schema-Versioning korrekt handhaben.

3. **Sponsor-Demo Deadline:** setzt die effektive Frist für D2-Schwellwert. Wenn Demo in 4 Wochen → engerer Track. Wenn Demo in 8 Wochen → genug Zeit für mehrere D2-Iterationen.

4. **Pilot-Mitgliedschafts-Mapping:** in D1 brauchen wir eine Hilfs-JSON, die Free-Text-Group-Names auf hsg-profiles-IDs mappt. Manuell anzulegen (~30 Minuten Mensch-Arbeit), nicht Claude-Job.
