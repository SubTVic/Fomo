<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Konzept: Welche Daten sammeln wir – und wofür?

Studie 2 ignorieren wir. Stattdessen sammeln wir **im echten Betrieb**
fortlaufend anonyme Nutzungsdaten. Das ist günstiger, realistischer und liefert
genau die Signale, die wir für Algorithmus, StuRa-Reporting und Weiterentwicklung
brauchen.

## Leitplanken (DSGVO by design)

- **Nur clientseitig & anonym.** Keine personenbezogenen Daten, kein Login,
  keine Antwort-Profile, die einer Person zuordenbar sind.
- Transport über **Umami-Events** (cookielos, kein Banner nötig).
- Es werden nur **Aggregate** ausgewertet. Einzelne Events tragen nie eine ID,
  die auf eine Person zeigt.
- Alles ist abschaltbar: ohne `UMAMI_WEBSITE_ID` läuft FOMO komplett
  ohne Tracking.

## Bereits eingebaut

`src/lib/analytics.ts` + die Quiz-/Browse-/Ergebnis-Komponenten feuern:

| Event | Wann | Nutzlast (anonym) |
|---|---|---|
| `quiz-start` | Quiz beginnt | gewählte Filter (Liste + Anzahl) — auch wenn das Quiz danach abgebrochen wird |
| `quiz-item-view` | Jede Frage wird angezeigt | Index, Item-ID, Gesamtzahl → Funnel/Drop-off pro Frage |
| `quiz-item-back` | „Zurück"-Button | Index, von dem zurückgegangen wurde |
| `quiz-complete` | Ergebnisse erreicht | #beantwortete (nicht-neutrale) Items, #Filter |
| `quiz-response` | Ergebnisse erreicht | **alle 21 Antworten (−1/0/1) + gewählte Filter** — siehe Hinweis unten |
| `quiz-result-group` | Ergebnisse erreicht | je ein Event pro initial angezeigter Gruppe (Top 5 inkl. punktgleicher an der Grenze): Slug, Rang, Score → „welche Gruppen kommen raus, wie oft?" (feuert nur bei echtem Abschluss, nicht beim Öffnen geteilter Links) |
| `quiz-edit` | „Antworten ändern" auf der Ergebnisseite | – |
| `quiz-restart` | „Von vorne beginnen" | – |
| `results-tab` | Wechsel Gruppen/Vergleichen | gewählter Tab |
| `results-show-more` | „Weitere anzeigen"/„Weniger anzeigen" | neuer Zustand |
| `results-zero-hits` | 0 Treffer angezeigt | – |
| `results-feedback` | 👍/👎 auf der Ergebnisseite | `up`/`down` |
| `results-share-copy` | „Teilen"-Link kopiert | – |
| `self-recognition` | freiwillige Frage auf der Ergebnisseite | „Schon Mitglied? In welcher Gruppe?" + der Rang, den UNSER Ranking dieser Gruppe gab → passiver Selbsterkennungs-Test (Ersatz für Studie 2) |
| `group-click` | Klick auf Website/Instagram/Mail | Gruppen-Slug, Ziel, `context` (browse/results/detail), `rank` (bei Ergebnissen) |
| `group-detail-open` | Klick auf „Profil öffnen" | Gruppen-Slug, `context`, `rank` |
| `groups-category-filter` | Kategorie-Chip beim Browsen | Kategorie-Name |
| `groups-show-unverified` | Toggle „Auch unbestätigte…" | neuer Zustand |
| `lang-switch` | DE/EN-Umschalter | Zielsprache |

**Hinweis zur Abweichung vom Konzept unten:** Der ursprüngliche Plan (siehe
„Bewusst NICHT sammeln") wollte bewusst **keine vollständigen Antwortvektoren**
senden, weil 21 Antworten kombiniert mit Gerät/Zeitstempel im Prinzip als
Quasi-Fingerabdruck einer Session dienen könnten (auch ohne Namen/ID). Nach
ausdrücklicher Rückfrage („ich will alle. anonym ist ok") senden wir seit
Juli 2026 dennoch den vollen Vektor in `quiz-response`, weil pro-Item-
Aggregation (Trennschärfe, Neutral-Quote) sonst nicht sauber rekonstruierbar
ist. Es bleibt **ohne jede ID/Name/IP-Verknüpfung auf unserer Seite** – das
Restrisiko ist die allgemeine Umami-Session-Zuordnung (siehe Datenschutz), wie
bei jedem Analytics-Tool.

### Bereits umgesetzt: Was vorher als „zusätzlich sammeln" vorgeschlagen war

### 1. Quiz-Funnel & Abbrüche  → *bestes Signal für working-set-v3* ✅
`quiz-item-view` pro Frage ersetzt einen fragilen beforeunload-Hook: Drop-off
pro Frage, Antwortverteilung pro Item und Neutral-Quote lassen sich jetzt aus
`quiz-item-view` (Nenner) + `quiz-response` (Zähler pro Itemwert) errechnen.

### 2. Ergebnis-Interaktion  → *Qualität des Matchings* ✅
`group-click`/`group-detail-open` tragen jetzt `context` + `rank` auf **allen**
drei Oberflächen (Browsen, Ergebnisse, Detailseite) — vorher feuerten nur die
Detailseiten-Links überhaupt ein Event. `results-zero-hits` deckt die
0-Treffer-Quote ab, `quiz-restart` die „Nochmal"-Quote.

### 3. Filter-Nutzung ✅
`quiz-start` sendet jetzt die tatsächliche Filterauswahl (nicht nur die
Anzahl), zusätzlich `groups-category-filter` für Kategorie-Interesse beim
Browsen.

### 4. Reichweite & Kontext (liefert Umami automatisch)
Sessions/Tag, Peak-Zeiten (Erstiwoche!), Gerät (Mobil-Anteil), Einstiegsseite,
Verweildauer. `lang-switch` ergänzt, welche Sessions aktiv zwischen DE/EN
wechseln (präziser als Umamis Browser-Sprache-Statistik).

### 5. Mini-Feedback (1 Klick, anonym) ✅
„War das hilfreich? 👍 / 👎" auf der Ergebnisseite → `results-feedback`.

## Wem nützt das?

| Zielgruppe | Nutzen |
|---|---|
| **Algorithmus/Entwicklung** | Item-Trennschärfe, Drop-off, Antwortverteilungen → datenbasiertes working-set-v3; Ranking-Tuning (z. B. Tie-Breaker, Item-Gewichte) |
| **StuRa** | Reichweite („X Erstis haben FOMO gemacht"), Wirkung pro Gruppe (Leads/Klicks), Peak-Tage – belegbarer Nutzen der 3.000 € Förderung |
| **Hochschulgruppen** | Sichtbarkeit/Interesse an ihrer Gruppe → Anreiz zur Registrierung |
| **Skalierung** | pro Hochschule eigene Umami-Website-ID → sauberer Standort-Vergleich (Dresden/Leipzig/Chemnitz) |

## Auswertung: der Report-Generator

Umamis eigenes Dashboard zeigt nur Rohwerte (`WS2-07: 1`). Für lesbare
Auswertung gibt es `npm run report` (`scripts/report.mjs`): holt die Events
per Umami-API, verheiratet sie mit `quiz.json` (Fragetexte) und `groups.json`
(Gruppennamen) und erzeugt **eine HTML-Datei mit Diagrammen** — Antworten pro
Frage, Filterwahl, Abbruch-Funnel, Top-Gruppen in den Ergebnissen und eine
**Bias-Analyse** (u. a. Simulation tausender Profile gegen den echten
Matcher). Der Report wird außerdem bei jedem Vercel-Build erzeugt und liegt
live unter `/report/` (noindex; wöchentlicher Auto-Refresh per GitHub Action).

**Historie:** Eine zwischenzeitliche Google-Sheets-Anbindung (Client-Beacon an
einen offenen Apps-Script-Endpoint) wurde im Juli 2026 revertiert — sie lief
am Umami-Opt-in vorbei und widersprach der Datenschutzerklärung. Der Report
deckt den Bedarf über die eine, deklarierte Datensenke ab.

## Umsetzung

**Stand Juli 2026: alle oben genannten Events sind gebaut** (siehe „Bereits
eingebaut"). Offen bleibt nur der Betrieb:

1. Umami-Website-ID setzen (`UMAMI_WEBSITE_ID` fürs Tracking;
   `UMAMI_API_KEY` + `UMAMI_WEBSITE_ID` zusätzlich für den /report/-Build).
2. Nach ein paar Wochen Echtbetrieb: den Bias-Abschnitt des Reports als
   ersten working-set-v3-Datenpunkt heranziehen.

## Bewusst NICHT sammeln

- Keine IPs, keine Klarnamen, keine Matrikel-/Login-Daten, kein Login. FOMO
  bleibt anonym – das ist Teil des Produktversprechens.
- Keine Verknüpfung von `quiz-response` mit einer Kennung, die über eine
  einzelne Session hinaus wiedererkennbar wäre.

**Abweichung von der ursprünglichen Fassung dieses Dokuments:** Hier stand
zuvor „keine vollständigen Antwortvektoren" (Re-Identifizierungs-Risiko in
Kombination mit Gerät/Zeitstempel). Nach expliziter Entscheidung wird der
volle 21-Antworten-Vektor dennoch gesendet (siehe Hinweis-Kasten oben bei
`quiz-response`) — bewusst abgewogen gegen den Nutzen für die Item-Analyse,
nicht versehentlich vergessen.
