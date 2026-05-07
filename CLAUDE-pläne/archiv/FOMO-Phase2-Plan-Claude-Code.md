# FOMO Phase 2 — Implementierungsplan für Claude Code

> **Stand:** 04. Mai 2026
> **Empfänger:** Claude Code (operiert in der bestehenden FOMO-Codebase)
> **Status:** Aktiv. Blockiert: Sponsor-Demo, Launch-Vorbereitung
> **Ablageort:** `CLAUDE-pläne/PHASE2-PLAN.md`
> **Direktive:** ultrathink

---

## 0. Kontext & Leitprinzipien

### Wo wir stehen

Phase 1 (Pilot-Umfrage) ist datenseitig abgeschlossen. 67 Sessions, alle 59+ Items beantwortet. Kernbefunde:

- **D7, D5, D8, D4, D2, D9** funktionieren psychometrisch sehr gut bis akzeptabel (Cronbach's α 0.67–0.89)
- **D10 Einstiegsfreundlichkeit** ist zerschossen (α=0.07, alle 4 Items rot) → muss konstruktiv neu gedacht werden, nicht nur Item-Tausch
- **D8Q1 ↔ D8Q3** sind redundant (r=0.764), eine raus
- **D3Q5 (invers)** funktioniert nicht (r_it=+0.14 trotz Inversion), ersetzen
- **Inversionslogik** wurde gegen Roh-Daten validiert und ist mathematisch korrekt — das D10-Problem ist inhaltlich, kein Code-Bug. Den Code-Audit (`prompt-check-inverse-items.md`) trotzdem durchführen, damit das offiziell verifiziert ist.
- Demografie ist Erstis-light (nur 2/67 erste Semester) — psychometrisch nutzbar, aber für Übertragbarkeit auf Zielgruppe limitiert.

### Was Phase 2 erreicht

Phase 2 ist die **Brücke zwischen "wir wissen, was wir fragen wollen" und "wir können sponsorenfähig demonstrieren, dass FOMO funktioniert"**. Sie umfasst vier Hauptlieferungen:

1. **Working Set v1** — die ~20 Quiz-Fragen (eingefroren, nicht final, aber arbeitsfähig)
2. **Scraper-Pipeline** — automatische Klassifizierung von ~83 Hochschulgruppen
3. **Group Registration Flow** — token-basierte Invite-Links, Gruppen korrigieren ihre Profile
4. **Sponsor-Demo** — vollständig spielbarer Prototyp

### Leitprinzipien für diese Phase

**Prinzip 1 — Architektur-Vorausschau ohne Migration.**
Der externe Architektur-Review (`FOMO-Architektur-Review-André.md`) empfiehlt mittelfristig Static Hosting + JSON-Daten + Umami statt Next.js-Server + PostgreSQL + Auth.js. **Diese Migration findet in Phase 2 NICHT statt.** Aber: Jede neue Komponente in Phase 2 wird so gebaut, dass der spätere Übergang minimal Code anfasst. Konkret heißt das:

- Group-Daten werden **so modelliert, dass sie 1:1 in eine JSON-Datei dumpbar sind** — keine komplexen Joins, keine prozessuralen Ableitungen zur Laufzeit
- Matching-Logik bleibt **vollständig client-seitig** (ist sie schon, das bleibt so)
- Neue API-Routes werden **maximal dünn** gehalten — Read/Write von Daten, keine Business-Logik
- Kein neues Auth.js für Group-Registrierung. Stattdessen HMAC-signierte Tokens (siehe §3.1) — diese funktionieren static-kompatibel

**Prinzip 2 — Working Set ist arbeitsfähig, nicht final.**
Die 20 Items werden jetzt für den Prototyp festgelegt. Sie können sich noch ändern, wenn die Group-Profile aus dem Scraper zurückkommen und sich zeigt, dass eine Frage über Gruppen hinweg nicht diskriminiert. Daher: Items so modellieren, dass Austausch eines einzelnen Items keinen Domino-Effekt auslöst.

**Prinzip 3 — Matching-Validierung vor Sponsor-Demo.**
Bevor wir einem Sponsor einen Prototyp zeigen, der "FOMO funktioniert" sagt, brauchen wir empirische Evidenz. Wir haben 24 aktuelle/ehemalige HSG-Mitglieder im Pilot, viele haben ihre Gruppe(n) im Free-Text genannt. Self-Recognition-Test (siehe §5) ist Pflicht-Vorbereitung für die Demo.

**Prinzip 4 — Item-Gewichtung empirisch ableiten, nicht raten.**
Die aktuelle Formel `weight = |norm − 0.5| × 2` behandelt jede Frage strukturell gleich. Sobald Group-Profile da sind, kann pro Dimension die **Inter-Gruppen-Varianz** berechnet werden — Dimensionen mit hoher Varianz (Gruppen unterscheiden sich stark) bekommen höheres Gewicht. Das ist Phase-2-Optimierung, kein Phase-3-Thema.

### Was Phase 2 ausdrücklich NICHT umfasst

- ❌ Migration zu Static Hosting
- ❌ Umami-Self-Hosting (Cloud-Free-Tier reicht für die Demo)
- ❌ Multi-Hochschul-Architektur (Leipzig/Chemnitz kommt nach Launch-Validierung in Dresden)
- ❌ Nutzer-Accounts (FOMO bleibt anonym)
- ❌ Auth.js-Erweiterung (im Gegenteil: Auth.js wird nur noch für Admin-Panel genutzt, nicht für Group-Registrierung)
- ❌ Vollständige Überarbeitung von D10 als Item-Set (D10 wird in Phase 2 als 1 Standalone-Item neu gedacht, siehe §1.1)

---

## 1. Sofort-Maßnahmen (Reihenfolge zwingend)

### 1.1 Working Set v1 finalisieren und in DB importieren

Vor allem anderen muss die Item-Auswahl als verbindliches Set einfrieren. Vorschlag basierend auf r_it × SD aus der Pilot-Analyse (04.05.2026):

| Dimension | Items | Begründung |
|---|---|---|
| D7 Internationalität | 1: D7Q3 | α=0.88 → ein Item reicht für's Matching, alle messen dasselbe |
| D5 Kreativität | 1: D5Q5 | α=0.85, r_it=0.79, höchste diskriminative Power |
| D8 Kompetitivität | 1: D8Q3 | α=0.84; D8Q1 ist redundant zu D8Q3 (r=0.76) |
| D4 Politik | 2: D4Q4 + D4Q3 | α=0.80, decken Aktion und Haltung ab |
| D2 Hands-on | 2: D2Q1 + D2Q5 (invers) | α=0.71, Inverses funktioniert |
| D9 Digital/Analog | 2: D9Q5 + D9Q4 (invers) | Bodeneffekt im Sample, brauche zwei Items für Robustheit |
| D6 Werte | 2: D6Q4 + D6Q3 | D6Q2 hat Deckeneffekt (85% Zustimmung), nicht nutzbar |
| D3 Geselligkeit | 2: D3Q4 + D3Q1 | D3Q5-invers funktioniert nicht, daher ohne Inversion |
| D1 Zeitbudget | 2: D1Q5 + D1Q1 | bipolar, keine Deckeneffekte |
| **D10 Einstiegsfreundlichkeit** | 1 (NEU) | siehe unten |
| Standalone NEU (aus HSG-Feedback) | 3 | Altruismus, Ziel/Zeitplan, Outdoor |

**= 19 vorhandene + 1 D10-Neukonstruktion + 0 Reserve = 20 Items.**

**D10-Neuformulierung:** Statt 4 Items zur "Einstiegsfreundlichkeit" (die laut Pilot kein gemeinsames Konstrukt bilden) ein einzelnes Standalone-Item, das den eigentlichen Diskriminator misst:

> "Ich bevorzuge Gruppen, in denen ich auch ohne Vorerfahrung sofort mitmachen kann, gegenüber Gruppen mit höheren Einstiegsanforderungen."

Das misst direkt das Matching-relevante Trade-off, ohne den Konstrukt-Konflikt der vier alten Items.

**Standalone-Items aus HSG-Feedback** (Texte für Psychologin-Review, dann importieren):
- "Es ist mir wichtig, in der Gruppe anderen Menschen direkt helfen zu können." (Altruismus, aus Sanitätsdienst-Feedback)
- "Ich will in der Gruppe auf ein konkretes Ziel mit klarem Zeitplan hinarbeiten." (Zielorientierung, aus Elbflorace-Feedback)
- "Ich verbringe Gruppenzeit am liebsten draußen." (Outdoor, aus Reitsport-Feedback)

**Tasks für Claude Code:**

1. Pilot-Daten aus DB exportieren und archivieren als `archives/pilot-responses-2026-05-04.json`
2. **Alle Pilot-Antworten löschen** (DB-Cleanup vor Working-Set-Import)
3. Neues JSON `working-set-v1.json` anlegen mit den 20 Items, klar kategorisiert (Dimension, Inverse-Flag, zugehöriges Gruppen-Attribut)
4. Seed-Skript schreiben, das `working-set-v1.json` in die DB importiert
5. Der Quiz-Live-Modus (im Gegensatz zum Pilot-Modus) liest aus diesem Set
6. Pilot-Modus bleibt erhalten als deaktivierte Route — nicht löschen, falls weitere Pilot-Runden gewünscht

**Acceptance Criteria:**
- [ ] `working-set-v1.json` ist im Repo, version-kontrolliert
- [ ] DB enthält genau 20 aktive Quiz-Items + die 59+ archivierten Pilot-Items
- [ ] Live-Quiz auf der Demo-Route zeigt die 20 Items in stabiler Reihenfolge
- [ ] Pilot-Antworten sind aus der Live-DB raus, aber als JSON-Archiv erhalten

### 1.2 Inverse-Item-Audit

Nutze den vorbereiteten Prompt `prompt-check-inverse-items.md`. Ziel: Beweise (mit Test), dass die Statistik-Berechnungen die Inversion an *jeder* Stelle korrekt anwenden — vor Mittelwert, vor r_it, vor Cronbach's α.

**Hinweis:** Externe Validierung gegen Roh-Daten (manuelle Inversion) zeigt, dass das Verhalten korrekt ist. Der Audit ist trotzdem nötig zur Verifikation und um den Test als Regression-Schutz zu verankern.

### 1.3 Button-Styling neutralisieren

Roter ✗ + grüner ✓ erzeugen Bias. Umstellung auf neutrales Drei-Button-Layout:

- **Nein** — Hintergrund Light Blue #ADD8E6 mit Navy-Border, kein Symbol
- **Egal** — Hintergrund weiß mit Navy-Border, kein Symbol
- **Ja** — Hintergrund Dark Navy #1a2a35 mit weißer Schrift, kein Symbol

Konsistent über alle vier Quiz-Varianten. Variant `chat` kann aus dem Live-Code raus (Pilot-Befund: 7% Präferenz, qualitatives Feedback durchweg negativ).

### 1.4 Tracking-Bug fixen

Im Pilot-Datensatz ist `startedAt` ≈ `completedAt` (teils 2ms vor Start). Die Zeitmessung ist kaputt. Bevor weitere Daten erhoben werden: `startedAt` muss bei *Mount* der Quiz-Komponente gesetzt werden, `completedAt` bei tatsächlichem Submit. Heißt vermutlich: Beide Zeitpunkte werden client-seitig erzeugt, Server speichert nur was er kriegt.

---

## 2. Scraper (Python, Anthropic API mit Web Search)

### 2.1 Eingangsdaten

Liste der ~83 Hochschulgruppen aus TU Dresden — vermutlich aus dem StuRa-Verzeichnis. Format: CSV oder JSON mit `{name, website?, description?}`. Sollte als `data/hsg-input-list.json` im Repo liegen.

### 2.2 Output-Schema (Single Source of Truth)

Output ist eine JSON-Datei `data/hsg-profiles-scraped.json`. Diese Datei ist **die zentrale Datenquelle für Group-Profile** und wird:

- vom Group Registration Flow gelesen (Pre-fill der Checkliste)
- vom Matching-Algorithmus gelesen (im Browser)
- später beim Static-Übergang direkt ins Bundle übernommen

Schema pro Gruppe:

```json
{
  "id": "elbflorace",
  "name": "Elbflorace e.V.",
  "shortDescription": "Formula Student Team der TU Dresden",
  "website": "https://elbflorace.de",
  "logoUrl": null,
  "attributes": {
    "career": true,
    "technology": true,
    "hands_on": true,
    "international": false,
    "creative": false,
    "competitive": true,
    "political": false,
    "social_focused": false,
    "values_driven": false,
    "outdoor": false,
    "altruistic": false,
    "goal_oriented": true,
    "easy_entry": false,
    "digital_first": false,
    "...": "..."
  },
  "scrapedFrom": ["https://elbflorace.de", "https://stura.tu-dresden.de/..."],
  "scrapedAt": "2026-05-04T...",
  "confidence": {
    "career": 0.95,
    "technology": 0.99,
    "...": "..."
  },
  "verifiedByGroup": false,
  "verifiedAt": null
}
```

Wichtige Schema-Eigenschaften:

- **Flat structure**: Alle Attribute als boolean in einem `attributes`-Objekt. Keine verschachtelten Strukturen. So bleibt das matching-relevante Daten-Objekt simpel und JSON-Static-tauglich.
- **Confidence pro Attribut**: Damit der Group Registration Flow den Gruppen *zeigen* kann, was unsicher ist und besonders um Bestätigung bittet. Confidence ≥ 0.85 → vorausgewählt mit "vom Scraper sicher". Confidence < 0.85 → vorausgewählt aber als "bitte bestätigen" markiert. Confidence < 0.5 → nicht vorausgewählt, neutral.
- **Attribute = 20 boolean Flags**, exakt die in `working-set-v1.json` referenzierten. Liste muss vor Scraper-Run festliegen und versioniert sein in `data/group-attributes-schema.json`.
- **scrapedFrom + scrapedAt**: Audit-Trail, falls eine Gruppe nachfragt "warum habt ihr das so eingestuft".

### 2.3 Scraper-Logik

Der Scraper ist ein **eigenes Python-Skript** im Verzeichnis `scripts/scraper/`, **nicht** im Next.js-Backend. Begründung: Einmalig-Tool, kein Live-Service, läuft auf Laptop oder lokalem CI. Saubere Trennung.

Pro Gruppe:

1. Anthropic API mit Web Search Tool aufrufen
2. Prompt-Template mit Gruppenname + 20 Attribut-Definitionen
3. Modell zurückgeben lassen: pro Attribut `{value: bool, confidence: float, evidence: string}`
4. JSON-Validierung gegen Schema, sonst Retry
5. Aggregation in `hsg-profiles-scraped.json`

**Kostenkontrolle:** Mit ~83 Gruppen × ~5K Token Input + 1K Token Output × Sonnet ≈ 3-4€. Vor erstem Vollrun: Trockendurchlauf mit 5 Gruppen (Elbflorace, IHD, SMD, Bits&Bäume, YETI), manuell verifizieren, erst dann auf alle 83 ausweiten.

### 2.4 Attribut-Definitionen (vor Scraper)

Bevor der Scraper sinnvoll laufen kann, müssen die 20 Group-Attribute klar und unmissverständlich definiert sein. Datei `data/group-attributes-schema.json`:

```json
{
  "attributes": [
    {
      "id": "career",
      "label": "Karriere & Berufsorientierung",
      "definition": "Die Gruppe fördert explizit beruflich-fachliche Kompetenzen oder Networking, die einen direkten Karrierebezug haben (z.B. Praxiserfahrung, Vorträge von Unternehmen, Bewerbungstraining).",
      "positive_examples": ["VWI", "bonding"],
      "negative_examples": ["Studententheater", "Wohnheim Wu5"],
      "matchedToQuestionIds": ["D2Q1"]
    }
    // ...
  ]
}
```

Diese Datei ist **die Brücke zwischen Quiz-Fragen und Group-Attributen** — sie macht explizit, welche Frage welches Attribut testet. Das ist die saubere Form von "decoupled from question wording" aus dem Memory: das Mapping ist explizit, nicht implizit.

### Acceptance Criteria

- [ ] `data/group-attributes-schema.json` existiert mit 20 Attributen, jedes mit Definition + 2 Positiv- + 2 Negativbeispielen
- [ ] `scripts/scraper/` enthält das Skript mit `requirements.txt`
- [ ] Trockendurchlauf auf 5 Gruppen produziert validen JSON-Output
- [ ] Vollrun produziert `data/hsg-profiles-scraped.json` mit allen ~83 Gruppen
- [ ] Manuelle Stichprobe (10 Gruppen) bestätigt sinnvolle Klassifikation

---

## 3. Group Registration Flow

### 3.1 Token-basierte Invite-Links (kein Auth.js)

**Architektur-Entscheidung:** Group-Registrierung läuft NICHT über Auth.js. Stattdessen HMAC-signierte Tokens. Begründung:

- Gruppen logged sich nie ein, sie öffnen einen Link, korrigieren Daten, submitten
- Auth.js für 83 einmalige Korrektur-Sessions ist Overkill
- HMAC-Tokens funktionieren static-kompatibel (kein Server-State nötig)
- Reduziert die Abhängigkeit von Auth.js, vereinfacht späteren Static-Übergang

**Token-Format:**

```
Base64URL(JSON({
  "groupId": "elbflorace",
  "issuedAt": 1714824000,
  "expiresAt": 1722686400  // 90 Tage
})) + "." + HMAC_SHA256_signature
```

URL-Format: `https://fomo.tu-dresden.de/g/edit?t={token}`

Server validiert Token, lädt Group-Profil, zeigt Edit-UI. Kein Cookie, kein Session-State. Token kann in der URL bleiben oder in Memory gehalten werden.

**Sicherheitsnotizen:**

- Secret als ENV-Var (`GROUP_INVITE_SECRET`)
- Bei Ablauf: Frontend zeigt "Link abgelaufen, hier neu anfordern" — Anforderung läuft per Mail an Admin
- Mehrfachverwendung erlaubt (Gruppen sollen ihre Daten auch später noch aktualisieren können)
- Submission updated `verifiedByGroup: true` und `verifiedAt`

### 3.2 Edit-Seite

Single Page, mobile-first, 5 Minuten Bearbeitungszeit als Ziel:

1. **Header**: "Hallo {Gruppenname}, hier ist euer FOMO-Profil. Bitte überprüft die 20 Eigenschaften."
2. **Pre-filled Description**: Editierbares Textfeld mit `shortDescription` aus Scraper
3. **20 Attribut-Toggles**:
   - Confidence ≥ 0.85: "Vom Scraper sicher" (kein extra Hinweis, einfach Toggle)
   - Confidence < 0.85: Gelber Hinweis "Bitte überprüft besonders" mit kurzer Definition
   - Jedes Toggle hat einen Info-Button mit der Definition aus `group-attributes-schema.json`
4. **Optional: Korrektur-Kommentar**: "Habt ihr Anmerkungen? (max. 200 Zeichen)"
5. **Submit-Button**: Speichert + zeigt Bestätigungsseite mit Vorschau, wie das Profil später Studierenden angezeigt wird

### 3.3 Datenfluss bei Submission

1. POST `/api/group/submit` mit Token + Edit-State
2. Server validiert Token, validiert Schema, **schreibt in Postgres** als source of record
3. Hintergrund-Task (oder einfach Cronjob/manueller Build) regeneriert `data/hsg-profiles-merged.json` aus Postgres — diese Datei ist die im Browser geladene Version (siehe §4.1)

### 3.4 Admin-View (read-only)

Bestehender Admin-Bereich (Auth.js) bekommt eine Group-Profile-Tabelle mit:
- Liste aller Gruppen
- Status: scraped / verified / outdated (>90 Tage)
- Klick → vollständige Profil-Diff (Scraper-Output vs. Group-Korrektur)
- Manuelle Aktion: "Neuen Invite-Link generieren und an {email} schicken"

E-Mail-Versand kann zunächst manuell sein (Token generieren, Link kopieren, in Mailprogramm). Automation ist Phase 3.

### Acceptance Criteria

- [ ] Token-Generierung & -Validierung implementiert mit Tests
- [ ] Edit-Seite läuft auf Mobile sauber, 5-Minuten-Test bestanden
- [ ] Submission updated DB + JSON-Bundle
- [ ] Admin-View zeigt verifizierte vs. unverifizierte Gruppen klar getrennt
- [ ] Pilot-Test mit 3 echten Gruppen (z.B. Elbflorace, IHD, YETI) absolviert

---

## 4. Datenmodell-Architektur (Static-Übergang vorbereiten)

Dies ist der Abschnitt, in dem **Phase-2-Bauweise = Static-Migration ohne Schmerz** festgelegt wird.

### 4.1 Single Source of Truth: das JSON-Bundle

Im Browser liest der Matching-Algorithmus eine einzige Datei: `/api/data/groups.json` (heute) bzw. `/data/groups.json` (nach Static-Übergang). Diese Datei ist:

- **Generiert, nicht handgeschrieben.** Aus Postgres exportiert.
- **Gecached und versioniert.** Z.B. mit ETag, hash-suffixed Filename, oder ISR alle 5 Minuten.
- **Vollständig.** Browser muss nichts mehr nachladen, um Matching zu rechnen.
- **Format-stabil.** Schema-Änderungen brauchen Migrations-Schritt im Generator.

Heute kann das JSON via Next.js API Route generiert werden:

```ts
// app/api/data/groups/route.ts
export async function GET() {
  const groups = await prisma.group.findMany({ where: { active: true } });
  return Response.json(groups.map(toPublicProfile), {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' }
  });
}
```

Beim Static-Übergang wird daraus ein File im Build-Step. Der Browser-Code ändert sich kein bisschen — er fetcht weiterhin `/data/groups.json`.

### 4.2 API-Routes minimieren

Aktuell hat das Projekt 20 API-Endpoints (laut Memory). Phase 2 hält die Anzahl konstant oder reduziert sie. Neue Endpoints in Phase 2:

- `POST /api/group/submit` — Group-Profil-Korrektur (token-authenticated)
- `GET /api/data/groups` — JSON-Bundle für Browser

Bei jeder neuen Route prüfen: Ist das Server-Side notwendig oder kann der Browser das selbst? Je weniger Server-Logik, desto leichter der Static-Übergang.

### 4.3 Matching-Modul isolieren

Refactoring (kein Feature, aber wichtig):

- Matching-Logik liegt als **reines TS-Modul** in `lib/matching/` ohne DB-, ohne Server-Imports
- Input: `{ userAnswers: AnswerSet, groups: GroupProfile[] }`
- Output: `MatchResult[]`
- Kann sowohl im Browser als auch im Server-Test ausgeführt werden
- 100% Unit-Test-Abdeckung für die Kernfunktion

Wenn das so ist, kann das Modul später in jedem Frontend-Framework genutzt werden, ohne Backend.

### 4.4 Was vom heutigen Stack später wegfällt

Zur Information für Architektur-Entscheidungen — **wir migrieren das nicht jetzt**, aber wissen sollten wir es:

| Komponente | Phase 2 | Static-Ziel |
|---|---|---|
| Next.js Server | Bleibt | Geht zu `output: 'export'` |
| PostgreSQL | Bleibt für Group-Editing | Wird zu Build-Time-JSON |
| Prisma | Bleibt | Optional — Build-Step kann auch CSV/JSON lesen |
| Auth.js | NUR für Admin-Panel | Bleibt für Admin oder Wegfall mit Static-Admin-Tool |
| Quiz-Antworten-DB | Aktuell für Pilot | Wird ersetzt durch Umami-Events |
| Token-System (§3.1) | Custom HMAC | Bleibt unverändert (static-kompatibel) |
| Group-Edit-Page | Server-rendered | Kann mit Tokens auch static laufen, wenn Submit per Edge Function geht |

Mit dieser Architektur ist die spätere Migration ein Build-Config-Wechsel + Edge-Function für Submit, kein Rewrite.

---

## 5. Matching-Validierung mit Pilot-Daten

Vor der Sponsor-Demo brauchen wir empirische Evidenz, dass der Algorithmus sinnvolle Ergebnisse liefert. Der Pilot enthält 24 HSG-Mitglieder, von denen einige ihre Gruppe(n) im Free-Text genannt haben.

### 5.1 Self-Recognition-Test

Skript `scripts/validation/self-recognition-test.ts`:

1. Lade Pilot-Sessions (archiviert)
2. Filtere auf Sessions mit `isMember=yes` AND nicht-leerer `groupNames`
3. Für jede dieser Sessions:
   - Mappe die Pilot-Antworten auf das Working-Set (nur die 20 finalen Items berücksichtigen)
   - Berechne Match-Score gegen alle Group-Profile aus `hsg-profiles-scraped.json`
   - Notiere: Auf welchem Rang taucht die selbstgenannte Gruppe auf?
4. Aggregierte Metriken:
   - **Top-1-Hit-Rate**: % der Sessions, in denen die genannte Gruppe Platz 1 ist
   - **Top-3-Hit-Rate**: % in den Top 3
   - **Top-10-Hit-Rate**: % in den Top 10
   - **Mean Reciprocal Rank**: Durchschnitt von 1/rank

**Zielwerte** (Daumenregel, da kein Benchmark existiert):
- Top-3 ≥ 40%: gut
- Top-3 ≥ 60%: sehr gut
- Top-3 < 25%: Algorithmus oder Profile sind problematisch

### 5.2 Diagnostik bei Misserfolg

Wenn die Hit-Rate niedrig ist, liegt das an einem von vier Dingen:

1. **Group-Profile falsch** (Scraper hat Attribute nicht erkannt) → Manuelle Korrektur einzelner Profile, neuer Test
2. **Working-Set-Items nicht prädiktiv** (Items messen nicht das, was Gruppen unterscheidet) → Item-Austausch
3. **Algorithmus zu naiv** (Gleichgewichtung aller Dimensionen unfair) → siehe §5.3
4. **Sample-Bias** (Pilot-Mitglieder waren in untypischen Gruppen) → Demo-Test mit handgewählten Test-Personen ergänzen

### 5.3 Item-Gewichtung empirisch ableiten

Sobald `hsg-profiles-scraped.json` da ist:

```python
# pseudocode
for dimension in dimensions:
    for attribute in dimension.attributes:
        groups_yes = sum(1 for g in groups if g.attributes[attribute])
        groups_no = len(groups) - groups_yes
        # Diskriminative Power = wie balanciert ist die Verteilung?
        balance = min(groups_yes, groups_no) / len(groups)
        weights[attribute] = balance * 2  # 0.0 bis 1.0
```

Attribute, die fast alle Gruppen oder fast keine haben, bekommen niedriges Gewicht (sie diskriminieren nicht). Attribute, die ungefähr 50/50 verteilt sind, bekommen Vollgewicht. Das wird im Matching-Algorithmus eingehängt — der User-Antwort-Weight wird mit dem Attribut-Weight multipliziert.

### Acceptance Criteria

- [ ] Self-Recognition-Test produziert Bericht mit Top-1/3/10-Hit-Raten
- [ ] Mindestens Top-3 ≥ 40% bei sponsoring-bereitem Stand
- [ ] Item-Gewichtung ist empirisch abgeleitet, nicht hardcoded
- [ ] Diagnostik-Skript identifiziert pro fehlgeschlagenem Match die wahrscheinliche Ursache

---

## 6. Sponsor-Demo

### 6.1 Was Sponsoren sehen

Eine einzige Demo-URL: `fomo-pi.vercel.app/demo` (existiert bereits). Inhalte:

1. **Quiz spielen** — 20 Fragen, Classic-Variante als Default, Swipe als Toggle
2. **Ergebnisseite** — Top-5 Gruppen mit Match-Score, alle weiteren ausgeblendet aber aufklappbar
3. **Aufklappbare Karte pro Gruppe** — Beschreibung, warum-passt-warum-nicht (Badge-System), Link zur Gruppen-Website
4. **Vergleichs-Modus** — zwei Gruppen nebeneinander
5. **"Über FOMO"-Footer** — Open-Source-Hinweis, GitHub-Link, Sponsoren-Logos (optional)

### 6.2 Was im Hintergrund läuft

- Echte 83 Gruppen-Profile (zumindest scraper-generiert)
- Empirisch abgeleitete Gewichtung
- Umami-Event-Tracking für: `quiz_started`, `quiz_completed`, `result_card_expanded`, `comparison_opened`, `external_link_clicked` (siehe §7.1)
- Anonyme Quiz-Antworten gehen NICHT mehr in DB (keine Pilot-Speicherung im Demo-Modus)

### 6.3 Demo-Stabilitäts-Tests

Vor jedem Sponsoren-Termin muss laufen:

- E2E-Test: Quiz von Anfang bis Ende, alle Buttons funktionieren
- Mobile-Test: iPhone Safari, Android Chrome
- Lighthouse: Performance ≥ 85, Accessibility ≥ 90
- Lasttest: 50 parallele Quiz-Sessions ohne Latenz-Spike (Vercel Free Tier sollte das schaffen)

### Acceptance Criteria

- [ ] Demo-Route ist mobile-first, schön, schnell
- [ ] Umami-Events werden gefeuert und im Dashboard sichtbar
- [ ] Quiz-Antworten werden NICHT persistiert
- [ ] Mindestens ein Trockenlauf mit echtem Sponsor-Termin-Setup ist absolviert

---

## 7. Architektur-Hygiene (für späteren Static-Übergang)

### 7.1 Umami JETZT integrieren

Empfehlung des Architektur-Reviews: Umami statt Eigen-Analytics. **Das machen wir jetzt** — Aufwand niedrig (<1h), Nutzen sofort, vereinfacht spätere Migration:

- Umami Cloud Free Tier (100K Requests/Monat)
- TU-Dresden-Website-ID anlegen (später Leipzig, Chemnitz separat)
- Tracking-Snippet in `app/layout.tsx`
- Custom Events:
  - `quiz_started` mit Attribut `variant`
  - `quiz_completed` mit `duration_seconds`, `match_top_score`
  - `result_card_expanded` mit `group_id`
  - `comparison_opened` mit `group_a_id`, `group_b_id`
  - `external_link_clicked` mit `group_id`, `link_type`

Das ersetzt **nicht** die Quiz-Antwort-Speicherung in Phase 2 (die ist für den Pilot-Modus weiterhin da). Es ergänzt eine Event-Schicht, die nach dem Static-Übergang die Hauptanalytik wird.

### 7.2 Was wir JETZT vermeiden

Damit der spätere Übergang einfach bleibt:

- ❌ Keine neuen DB-Tabellen für Things, die auch JSON sein könnten (z.B. statische Konfiguration, Listen)
- ❌ Keine Server-Side-Computation, die der Browser auch könnte
- ❌ Keine Auth.js-Routes für Endbenutzer (Tokens reichen, siehe §3.1)
- ❌ Keine Cookies oder Sessions für Endbenutzer
- ❌ Keine externen Services außer Anthropic API (für Scraper) und Umami

### 7.3 Was wir JETZT vorbereiten

- Daten-Export-Skript: `scripts/export-static-data.ts` schreibt aus Postgres ein vollständiges `static-data/` Verzeichnis. Initial nur als Demo, ohne Build-Integration. Aber: Wenn das Skript vorhanden ist, ist die Migration ein Build-Config-Wechsel.
- Build-time vs. Runtime-Trennung: ESLint-Regel oder Code-Review-Convention, dass `lib/matching/` nicht aus DB liest
- Environment-Variable-Hygiene: Alle Secrets in `.env`, klar dokumentiert in `.env.example`. Public Constants in TS-Konstanten-Files (geht später ins Bundle)

### 7.4 Repository-Struktur jetzt vorbereiten

Aktuell ist alles in einem Repo. Empfehlung des Architektur-Reviews war Public + Private. Phase 2 macht das **noch nicht**, aber:

- `data/` Verzeichnis (group-attributes-schema, hsg-profiles, working-set) ist klar getrennt von Code
- Wenn später Privates rauskommt: das Verzeichnis lässt sich isoliert in ein Private-Repo migrieren

---

## 8. Reihenfolge & Abhängigkeiten

```
Phase 2 Roadmap (geschätzt 4–6 Wochen)

Woche 1:
  ├── 1.1 Working Set v1 finalisieren + DB-Cleanup
  ├── 1.2 Inverse-Item-Audit
  ├── 1.3 Button-Styling neutralisieren
  ├── 1.4 Tracking-Bug fixen
  └── 2.4 Group-Attribute-Schema definieren

Woche 2:
  ├── 2.1–2.3 Scraper bauen + Trockenlauf
  ├── 4.1 JSON-Bundle-Endpoint
  ├── 4.3 Matching-Modul isolieren + Tests
  └── 7.1 Umami integrieren

Woche 3:
  ├── 2.x Vollrun Scraper auf 83 Gruppen
  ├── 3.1 Token-System implementieren
  └── 5.1 Self-Recognition-Test (mit Scraper-Output)

Woche 4:
  ├── 3.2–3.3 Group Edit Page
  ├── 3.4 Admin-View
  ├── 5.3 Item-Gewichtung empirisch
  └── 6 Demo-Polishing

Woche 5–6 (Puffer / Iteration):
  ├── Pilot-Test mit 3 echten Gruppen (Group Registration Flow)
  ├── Hit-Rate-Optimierung wenn nötig
  └── Sponsor-Termin-Vorbereitung
```

**Harte Abhängigkeiten:**

- Working Set v1 (1.1) → blockiert Quiz-Live-Modus + Group-Attribute-Schema (2.4)
- Group-Attribute-Schema (2.4) → blockiert Scraper (2.1–2.3)
- Scraper-Output (2.x) → blockiert Self-Recognition-Test (5.1) und Group Registration Flow (3.x)
- Self-Recognition-Test (5.1) → blockiert Sponsor-Demo (6) — keine Demo ohne Validierung

---

## 9. Acceptance Criteria für Phase 2 als Ganzes

Phase 2 ist abgeschlossen, wenn:

- [ ] Working Set v1 ist eingefroren, dokumentiert, im Live-Quiz aktiv
- [ ] Scraper-Pipeline ist reproduzierbar und produziert valide Group-Profile für 83 Gruppen
- [ ] Group Registration Flow funktioniert mit Token-Auth, mindestens 3 echte Gruppen haben ihr Profil korrigiert
- [ ] Self-Recognition-Test zeigt Top-3-Hit-Rate ≥ 40%
- [ ] Sponsor-Demo ist auf `/demo` spielbar, mobile-first, mit Echt-Daten
- [ ] Umami trackt alle relevanten Events, Dashboard ist eingerichtet
- [ ] Alle neuen Komponenten sind so modelliert, dass Static-Übergang ein Build-Config-Wechsel wäre, kein Rewrite
- [ ] Codebase hat keine neuen Auth.js-Endbenutzer-Routes
- [ ] `data/`-Verzeichnis ist Single Source of Truth, JSON-only, version-kontrolliert

---

## 10. Out of Scope für Phase 2

Klar abgegrenzt, damit Scope-Creep verhindert wird:

- ❌ Static Hosting Migration (Phase 3)
- ❌ Multi-Hochschul-Support (Phase 3, nach Launch-Validierung)
- ❌ Deutsch/Englisch-Sprachumschaltung
- ❌ Erweiterte Pilot-Runden mit Erstsemestern (das ist eigene kleine Phase 2.5 im Sommer, separat geplant)
- ❌ Public/Private Repo-Split
- ❌ E-Mail-Automation für Group-Invites (manueller Versand reicht)
- ❌ Komplexere Matching-Algorithmen (z.B. Embedding-basiert) — bleiben bei Cosine-Similarity-Variante
- ❌ User-Accounts oder gespeicherte Quiz-Ergebnisse
- ❌ Group-zu-Group-Empfehlungen ("Wenn dir X gefällt, magst du auch Y")

---

## 11. Verweise auf bestehende Dokumente

- `FOMO-Pilot-Kontext-April2026.md` — Pilot-Status und Item-Status
- `FOMO-Architektur-Review-André.md` — Mittelfristige Architektur-Vision (NICHT in Phase 2 umsetzen)
- `FOMOProjektkontext.pdf` — Gesamtprojekt-Kontext
- `prompt-check-inverse-items.md` — Audit-Prompt für 1.2
- `prompt-architecture-review.md` — Senior-Engineer-Review (für später)
- `prompt-bug-audit.md` — Vollständiger Bug-Audit (für später)
- Diese Datei: `CLAUDE-pläne/PHASE2-PLAN.md`

---

## 12. Offene Fragen vor Start

Vor dem ersten Commit zu Phase 2 sollten geklärt sein:

1. **Liste der 83 Hochschulgruppen** — wo kommt die her? StuRa-Verzeichnis? Manuelle Sammlung? Wenn nicht vorhanden: Erstelle `data/hsg-input-list.json` als manuellen Sammelpunkt.
2. **Anthropic API Key für Scraper** — wer hostet den Schlüssel, wer trägt die ~3-4€ Kosten?
3. **Umami-Account** — Cloud Free Tier oder Self-Hosting? Empfehlung: Cloud für Phase 2, Migration zu Self-Hosting in Phase 3.
4. **D10-Neuformulierung** — Kurz-Review mit Psychologin vor Working-Set-Freeze, oder erst im nächsten Pilot-Zyklus?
5. **Sponsor-Demo Termin-Ziele** — Wann muss die Demo stehen? Das setzt die Deadline für 5.1 (Self-Recognition-Test).

---

*Erstellt am 04. Mai 2026. Nächste Iteration nach Abschluss von Woche 1.*
