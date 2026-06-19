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
- Alles ist abschaltbar: ohne `NEXT_PUBLIC_UMAMI_WEBSITE_ID` läuft FOMO komplett
  ohne Tracking.

## Bereits eingebaut

`src/lib/analytics.ts` + die Quiz-/Karten-Komponenten feuern:

| Event | Wann | Nutzlast (anonym) |
|---|---|---|
| `quiz-start` | Quiz beginnt | Anzahl gewählter Filter |
| `quiz-complete` | Ergebnisse erreicht | #beantwortete (nicht-neutrale) Items, #Filter |
| `group-click` | Klick auf Website/Instagram/Mail | Gruppen-Slug, Ziel (`website`/`instagram`/`email`) |

## Was wir zusätzlich sammeln sollten (priorisiert)

### 1. Quiz-Funnel & Abbrüche  → *bestes Signal für working-set-v3*
Pro Item ein leichtes Event „Item X beantwortet" (nur Item-ID + Wert −1/0/1,
**kein** Personenbezug). Daraus:
- **Drop-off pro Frage:** Wo steigen Leute aus? → zu lange/unklare Items kürzen.
- **Antwortverteilung pro Item:** Items, bei denen ~alle gleich antworten, sind
  nicht trennscharf (deckt sich mit dem Audit-Befund zu schwachen Items) → in
  working-set-v3 streichen oder umformulieren.
- **Neutral-Quote pro Item:** hohe Neutral-Quote = Item versteht/triggert nicht.

### 2. Ergebnis-Interaktion  → *Qualität des Matchings*
- **Klickrate pro Ergebnis-Rang:** Werden vor allem die oberen Treffer geklickt?
  Wenn nicht, ist das Ranking schwach.
- **Klickrate pro Gruppe/Kategorie:** Welche Gruppen profitieren, welche tauchen
  nie auf? → Datenqualität dieser Gruppen prüfen / zur Registrierung motivieren.
- **„Nochmal"-Quote / 0-Treffer-Quote:** zu strenge Filter? unklare Items?

### 3. Filter-Nutzung
- Welche Filter werden gewählt, welche Kombinationen, wie oft „ohne Filter"?
  → Filterliste straffen, Reihenfolge optimieren.

### 4. Reichweite & Kontext (liefert Umami automatisch)
- Sessions/Tag, Peak-Zeiten (Erstiwoche!), Gerät (Mobil-Anteil), Sprache,
  Einstiegsseite, Verweildauer.

### 5. Optionales Mini-Feedback (1 Klick, anonym)
Auf der Ergebnisseite: „War das hilfreich? 👍 / 👎" → ein Event. Grobe, aber
ehrliche Zufriedenheitsmetrik ohne Fragebögen.

## Wem nützt das?

| Zielgruppe | Nutzen |
|---|---|
| **Algorithmus/Entwicklung** | Item-Trennschärfe, Drop-off, Antwortverteilungen → datenbasiertes working-set-v3; Ranking-Tuning (z. B. Tie-Breaker, Item-Gewichte) |
| **StuRa** | Reichweite („X Erstis haben FOMO gemacht"), Wirkung pro Gruppe (Leads/Klicks), Peak-Tage – belegbarer Nutzen der 3.000 € Förderung |
| **Hochschulgruppen** | Sichtbarkeit/Interesse an ihrer Gruppe → Anreiz zur Registrierung |
| **Skalierung** | pro Hochschule eigene Umami-Website-ID → sauberer Standort-Vergleich (Dresden/Leipzig/Chemnitz) |

## Umsetzung (klein halten)

1. **Jetzt:** vorhandene 3 Events nutzen, Umami-Website-ID setzen, Dashboard für
   StuRa einrichten.
2. **Phase „mehr Signal":** Item-beantwortet-Events + Ergebnis-Rang-Klicks
   ergänzen (wenige Zeilen in `analytics.ts`-Aufrufern). Damit lässt sich
   working-set-v3 **datenbasiert** statt per Laborstudie trimmen.
3. **Optional:** 👍/👎-Feedback auf der Ergebnisseite.

## Bewusst NICHT sammeln

- Keine vollständigen Antwortvektoren, die zusammen mit Gerät/Zeit
  re-identifizierbar wären – nur **aggregierte** Item-Statistiken.
- Keine IPs, keine Klarnamen, keine Matrikel-/Login-Daten. FOMO bleibt
  anonym – das ist Teil des Produktversprechens.
