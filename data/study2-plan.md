# Studie 2 — Validierung & Optimierung

Stand: 2026-05-07
Item-Pool: [`working-set-v2.json`](./working-set-v2.json)

## Ziel

Das in v2 finalisierte Quiz (Hybrid: 1 Multi-Select-Filter + 20 Likert) auf einer **realen Mitglieder-Stichprobe** validieren und überflüssige Items vor Live-Schaltung entfernen.

**Studie 2 ist nicht exploratorisch** — die Fragen stehen, der Pool hat bewusst ~4 Items Puffer über dem Live-Ziel (~16 Items), damit nach der Auswertung die schwächsten gestrichen werden können.

## Methodisches Setup

Drei parallele Erhebungen mit identischem Item-Set:

| Erhebung | Wer | Aus welcher Sicht | Output |
|---|---|---|---|
| **A — Mitglieder-Quiz** | Mitglieder bekannter Gruppen (Ziel: ≥3 pro Gruppe) | „Was ich in einer Gruppe will" | Validierungs-Daten |
| **B — Gruppen-Selbst-Rating** | 1 Vertretung pro Gruppe (Phase 2) | „So ist unsere Gruppe" | Matching-Profile |
| **C — Nicht-Mitglieder-Quiz** | Studierende ohne Gruppenmitgliedschaft | „Was ich in einer Gruppe will" | Filter-Coverage-Test, Drop-Off-Messung |

Skala in **A**, **B**, **C** identisch: **3-Stufen** (Stimme zu / Neutral / Stimme nicht zu). Filter in allen drei: Multi-Select.

## Stichprobe

- **A — Mitglieder:** ≥60 Sessions, idealerweise 3 Mitglieder × 20 priorisierte Gruppen. Priorisierung: Gruppen mit klar trennenden Attributen (Elbflorace, Nightline, AEGEE, USV Klettern, 404 Esports, Big Band, Studententheater, AIESEC, etc.).
- **B — Gruppen:** Ziel 60–83 Gruppen (Phase-2-Verifikation). Mindest-Schwelle für Live-Quiz: **42 verifizierte Gruppen** (50 %).
- **C — Nicht-Mitglieder:** ≥30 Sessions, breiter rekrutiert (auch Erstis-nahe — Pilot 1 hatte nur 3 % Erstsemester, das muss in Studie 2 besser werden).

## Validierungs-Metriken

### M1 — MRR — Mean Reciprocal Rank (Hauptmetrik)

MRR = Ø(1/Rank der eigenen Gruppe) über alle auswertbaren Member-Sessions.

Warum MRR statt Top-K-Recall:
- Kein willkürlicher Cutoff (Top-5 vs. Top-7 macht für Erstis keinen Unterschied)
- Misst graduell wie weit oben die eigene Gruppe landet
- Ähnliche Gruppen die statt der eigenen auftauchen zählen nicht automatisch als Fehler
- Direkt vergleichbar mit v1-Baseline (MRR=0.197 auf scraped attributes)

**Erfolgskriterium:** MRR ≥ 0.30 (= Gruppe landet im Schnitt in Top 3–4, deutlich besser als Zufall ~0.03 bei 83 Gruppen)

### M1b — Top-10-Recall (Sekundärmetrik)

Anteil Member-Sessions wo eigene Gruppe in Top-10 landet.

**Erfolgskriterium:** Top-10-Recall ≥ 70 %

Top-5-Recall wird ebenfalls ausgegeben, aber **nicht** als Erfolgskriterium verwendet — zu harter Cutoff für ein 83-Gruppen-Set.

### M2 — Pro-Item-Diskriminierung

Für jedes Item: Δ = µ(Mitglied von Attribut-Gruppe) − µ(Mitglied von Nicht-Attribut-Gruppe), separat für Member-Sicht und Gruppen-Sicht.

**Drop-Schwelle:** |Δ| < 0.3 in beiden Quellen → Item raus.

### M3 — Inter-Item-Redundanz

Pearson-Korrelation aller Item-Paare in Erhebung A. Bei r > 0.7: das Item mit kleinerem |Δ| droppen.

### M4 — Filter-Coverage

Für jedes Filter-Attribut: Wie viele Mitglieder einer entsprechenden Gruppe wählen den Filter? Ziel: ≥70 %. Filter, die ihre Mitglieder verfehlen, sind schlechte Selbst-Identifikatoren.

### M5 — Drop-Off pro Item-Position

Aus C: An welcher Item-Position bricht der Median-Nutzer ab? Setzt die obere Grenze für die Item-Anzahl im Live-Quiz.

## Item-Trimming-Regeln (mechanisch nach der Studie)

In dieser Reihenfolge anwenden:

1. **Drop**, wenn |Δ| < 0.3 in beiden Quellen (M2).
2. Bei korrelierten Item-Paaren (r > 0.7, M3): das schwächere droppen.
3. Filter-Optionen mit Coverage < 50 % (M4) raus oder umformulieren.
4. Wenn nach Schritt 1–3 mehr als 16 Likert-Items übrig: nach |Δ| absteigend sortieren, nur Top 14–16 behalten (Konstrukt-Diversität wahren — pro Konstrukt mindestens 1 Item, auch wenn Δ schwächer).

**Keine Frage drinhalten, weil sie inhaltlich „gehört dazu" — wenn die Daten sie nicht stützen, raus.**

## Kandidaten zum Drop (Hypothesen vor der Studie)

Aus den Pilot-1-Daten und Scrape-Imbalances erwarte ich, dass Studie 2 diese fünf am ehesten als schwach ausweist:

| Item | shortTitle | Grund |
|---|---|---|
| WS2-14 | Nachhaltigkeit | Pilot Δ=-0.23, schwächster bekannter Diskriminator |
| WS2-17 | Einsteiger | beginnerFriendly 99% scraped — wenn Gruppen sich nicht selbst differenzieren, raus |
| WS2-03 | Verantwortung | leadershipOpportunities 100% scraped, gleicher Grund |
| WS2-18 | Freundschaften | networking 90% scraped |
| WS2-13 *oder* WS2-12 | Altruismus / Engagement | wahrscheinlich r > 0.7, dann eines raus |

→ Live-Ziel realistisch: 1 Filter + 15–16 Likert = 16–17 Quiz-Schritte.

## Phase-2-Anpassung

Die bisherige Phase-2-Verifikation lässt Gruppen eine Attribut-Checkliste bestätigen. **Diese muss durch das v2-Item-Set ersetzt werden:** Gruppen beantworten dieselben 20 Likert-Statements + Multi-Select-Filter aus ihrer Sicht — gleiche UI wie Erhebung A.

Vorteile:
- Selbst-Rating ist kognitiv leichter als Attribut-Definition lesen (siehe Pilot-Feedback).
- Gleiche Vektoren in A und B → Matching-Validierung trivial.
- Karriere / financialCost / language / groupSize / eventFrequency werden direkt erhoben (Scraper hatte sie teils, aber Selbst-Auskunft ist verlässlicher).
- Kein Re-Scrape nötig — Scrape liefert nur noch Beschreibungstext, Website, Logo.

## Output

- **Während der Studie:** kontinuierlicher Admin-Export (CSV/JSON) wie im Pilot.
- **Nach Studie 2 + Phase 2:**
  - `working-set-v3.json` — Live-Quiz-Item-Set (15–16 Likert + Filter)
  - `study2-results.md` — Top-K-Recall-Werte, gestrichene Items mit Begründung
  - `group-profiles-v1.json` — Gruppen-Selbst-Ratings als Matching-Profile

## Zeitplan-Vorschlag

| Schritt | Wann |
|---|---|
| `working-set-v2.json` final, Studie-2-Setup im Code | Mai 2026 |
| Phase-2-Versand mit neuer Gruppen-Befragung | Mai/Juni 2026 |
| Erhebung A + C (Mitglieder + Nicht-Mitglieder) | Juni/Juli 2026 |
| Auswertung, Item-Trimming, `working-set-v3.json` | Juli 2026 |
| Live-Schaltung zur Erstsemester-Woche | September 2026 |
