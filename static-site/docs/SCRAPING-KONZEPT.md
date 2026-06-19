<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Konzept: Daten für nicht registrierte Gruppen scrapen & live austauschen

## Ausgangslage

- ~83 Hochschulgruppen sollen matchbar sein, aber nur ein Teil **registriert**
  sich aktiv (bestätigt seine 17 Attribute + bewertet die WS2-Items selbst).
- Für **nicht registrierte** Gruppen fehlt diese Selbstbewertung. Ohne sie
  behandelt der Matcher jedes Item als neutral → die Gruppe taucht kaum sinnvoll
  in Ergebnissen auf.
- **Grundprinzip (unverändert):** Die Registrierung bleibt, wie sie ist. Wir
  ändern **nichts** am 17-Attribut-Schema oder am Self-Rating – niemand muss
  sich neu registrieren. Gescrapte Daten sind nur ein **Fallback**, der von
  jeder echten Registrierung sofort überschrieben wird.

## Pipeline im Überblick

```
 Quellen (Web, StuRa-Liste,        scraped-groups.json      data/groups.json
 Instagram, bestehender Scraper)  ────────────────────▶   (Schema wie gehabt)
        │                          attributes{17} +              │
        │  scrapen/normalisieren   groupSize/freq/lang           │ derive-selfrating.mjs
        ▼                                  │                       ▼
   17 Attribute je Gruppe                  └──── + echte Registrierungen ───▶ validate-data.mjs
                                              (--overrides Export)              │
                                                                               ▼
                                                                      update-data.sh (live, ohne Downtime)
```

Konkrete Skripte (liegen in `scripts/`):

1. **`derive-selfrating.mjs`** – erzeugt aus den gescrapten Attributen eine
   *provisorische* Selbstbewertung. Es nutzt exakt die `item → attribute`-
   Mappings aus `quiz.json` (inkl. `isInverse` und `valueMap` für
   groupSize/eventFrequency/language). Echte Registrierungen werden via
   `--overrides <export.json>` übernommen und gewinnen immer.
2. **`validate-data.mjs`** – Schema-/Integritäts-Gate. Bricht bei kaputten Daten
   ab, bevor etwas live geht.
3. **`update-data.sh`** – baut + schaltet ohne Downtime live (siehe
   `INBETRIEBNAHME.md`).

Beispiel:

```bash
node scripts/derive-selfrating.mjs \
  --in scraped-groups.json \
  --quiz data/quiz.json \
  --overrides registrierung-export.json \
  --out data/groups.json
./scripts/update-data.sh        # validiert, baut, schaltet live
```

Jede abgeleitete Gruppe erhält `selfRating.derived = true` und `raterCount = 0`
– so kann die UI/Admin sie als „automatisch ermittelt, noch nicht bestätigt"
kennzeichnen und Gruppen zur Registrierung motivieren.

## Wie gut ist gescrapt ≈ selbst bewertet? (ehrliche Messung)

Test: die 36 real bewerteten Gruppen so behandeln, als wären sie **nur**
gescrapt (Self-Rating ignoriert), ableiten, dann mit der echten Bewertung
vergleichen (nur dort, wo die Gruppe selbst eine klare Haltung hatte):

| Metrik | Wert |
|---|---|
| Gleiche Richtung (Ableitung stimmt) | **53 %** |
| Entgegengesetzt (Ableitung falsch) | **37 %** |
| Ableitung neutral, obwohl Haltung da war | **10 %** |

**Schlechteste Items:**

| Item | Übereinstimmung | Grund |
|---|---|---|
| WS2-21 (Entrepreneurship) | **0 %** | `entrepreneurship` ist **keines** der 17 Attribute → nicht ableitbar |
| WS2-08 (Gruppengröße-Präferenz) | 30 % | *tatsächliche* Größe ≠ *gewünschte* Größe |
| WS2-05 (Hands-on-Lernstil) | 33 % | Aktivität „hands-on" ≠ persönlicher Lernstil |
| WS2-17 (Einsteigerfreundlich) | 37 % | im Scraper fast immer „true", kaum trennend |

### Fazit & Konsequenzen

- Scraping ist ein **grober Lückenfüller, kein Ersatz** für die Registrierung.
  Vor allem die bewusst neuen „Persönlichkeits-/Präferenz"-Items der WS2-Liste
  lassen sich aus reinen Aktivitäts-Attributen nicht zuverlässig ableiten.
- **Empfehlungen:**
  1. Abgeleitete Gruppen sichtbar als „unbestätigt" markieren (`derived:true`)
     und mit niedrigerer Priorität behandeln (z. B. im Ergebnis kennzeichnen).
  2. Registrierung weiter aktiv bewerben – jede Registrierung ersetzt sofort die
     schwachen abgeleiteten Werte (kein Re-Registrierungs-Aufwand für bereits
     Registrierte).
  3. Für die wenigen klar ableitbaren Items (international, outdoor, music,
     sports, religion, career) ist die Ableitung brauchbar; die Mappings dort
     ggf. feinjustieren.
  4. `entrepreneurship` hat kein Attribut: entweder das Item in working-set-v3
     streichen, oder – **ohne** die laufende Registrierung zu ändern – später
     ein optionales 18. Attribut nur für *neue* Registrierungen ergänzen.

## Besserer Scraper mit aktuellem Wissen: gelerntes Mapping (umgesetzt)

Die registrierten Gruppen sind **gelabelte Trainingsdaten** (echte Bewertung +
gescrapte Attribute). Daraus lässt sich pro Item ein besseres Mapping lernen,
statt es von Hand zu raten.

- **`scripts/train-derive-model.mjs`** lernt aus den registrierten Gruppen pro
  Item ein feature-gewichtetes Modell und vergleicht es per Leave-one-out-CV mit
  dem Hand-Mapping. Nur wo das gelernte Modell klar gewinnt, wird es genutzt
  (`useLearned`). Ergebnis: `derive-model.json`.
- **`derive-selfrating.mjs --model derive-model.json`** wendet es an – gelernt wo
  besser, sonst naiv.

**Gemessenes Ergebnis (LOO, ehrlich):** Übereinstimmung **53 % → 59 %**.
Gelernt wird aktuell für **WS2-04** (international), **WS2-16** (Sprache),
**WS2-18** (Freundschaften) und **WS2-21** (Entrepreneurship – vorher 0 %, da
ohne Attribut nicht von Hand ableitbar). Das Modell **verbessert sich
automatisch**, je mehr Gruppen sich registrieren – einfach neu trainieren.

```bash
node scripts/train-derive-model.mjs --in data/groups.json --out data/derive-model.json
node scripts/derive-selfrating.mjs --in scraped-groups.json \
  --model data/derive-model.json --overrides export.json --out data/groups.json
```

> Grenzen: Bei wenigen Registrierungen ist das Signal schwach (Overfitting-
> Risiko, daher LOO + nur klare Gewinner). Der größere Hebel sind **bessere
> Merkmale**: die Gruppen-**Texte** tragen mehr Signal als die binären Attribute
> (z. B. Wettbewerbs-Keywords korrelieren +0.43 mit den Wettbewerbs-Items). Ein
> Keyword-/LLM-Klassifikator über die „Über uns"-Texte, der die WS2-Items direkt
> beantwortet (mit menschlicher Freigabe), ist der nächste sinnvolle Schritt –
> er passt in genau dieselbe `scraped-groups.json`-Pipeline.

## Datenquellen fürs Scraping

| Quelle | Liefert |
|---|---|
| StuRa-Hochschulgruppenliste | Name, Kategorie, Website, Kontakt |
| Gruppen-Webseiten / „Über uns" | Beschreibung, Sprache, Aktivitäten → Attribute |
| Instagram/Social | Aktivitätsfrequenz, Eventhinweise, Bilder |
| Bestehender Scraper der dynamischen App | bereits genutzt, um Registrierung vorzufüllen – als Basis weiterverwenden |

Attribute aus Texten ableiten kann manuell (Checkliste) oder
(halb-)automatisch (Keyword-/LLM-Klassifikation der „Über uns"-Texte)
passieren. Wichtig: **Ergebnis ist immer eine `scraped-groups.json` im
festen Schema** – der Rest der Pipeline bleibt gleich.

## Schema `scraped-groups.json` (Minimum)

```jsonc
{
  "groups": [{
    "id": "stabil-eindeutig",          // für Override-Matching mit Registrierung
    "name": "…", "slug": "…",
    "shortDescription": "…", "longDescription": "…",
    "categoryName": "…", "categoryColor": "#…", "categoryIcon": "…",
    "websiteUrl": null, "instagramUrl": null, "contactEmail": null,
    "language": "german|english|both",
    "eventFrequency": "high|medium|low",
    "groupSize": "small|medium|large",
    "attributes": { /* die 17 Booleans */ }
    // selfRating wird von derive-selfrating.mjs erzeugt
  }]
}
```

## Live-Austausch ohne Downtime

Schon umgesetzt über `update-data.sh` (atomarer Symlink-Swap + nginx-Reload,
letzte 5 Releases als Rollback). Ein Cron-Job kann den Lauf automatisieren
(André's Idee „Tabelle pflegen → automatisch neu bauen"):

```cron
# täglich 04:00: Export ziehen, Modell trainieren, ableiten, live schalten
0 4 * * *  cd /opt/fomo/static-site \
  && node scripts/train-derive-model.mjs --in data/groups.json --out data/derive-model.json \
  && node scripts/derive-selfrating.mjs --in /opt/fomo/scraped-groups.json \
       --model data/derive-model.json --overrides /opt/fomo/export.json --out data/groups.json \
  && ./scripts/update-data.sh >> /var/log/fomo-update.log 2>&1
```
