<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Konzept: Daten für nicht registrierte Gruppen scrapen & live austauschen

## Ausgangslage

- ~83 Hochschulgruppen sollen matchbar sein, aber nur ein Teil **registriert**
  sich aktiv (bewertet die WS2-Items selbst).
- Die **statische Version matcht ausschließlich** über `selfRating.answers`
  (21 Item-Antworten −1/0/1) **und** `selfRating.filterSelections`. Die alten
  **17 Binär-Attribute werden nicht mehr gebraucht** – die App liest sie nirgends.
- **Grundprinzip (unverändert):** Die Registrierung bleibt, wie sie ist – niemand
  muss sich neu registrieren. Gescrapte Daten sind nur ein **Fallback**, der von
  jeder echten Registrierung sofort überschrieben wird.

## Pipeline

```
 groups-seed.json            scraped-groups.json              data/groups.json
 (Name, URL, Kontakt)  ──▶   (selfRating: 21 Items     ──▶    (real wo registriert,
                              + filterSelections,             sonst gescrapt)
   scrape-groups.mjs          KEINE 17 Attribute)              derive-selfrating.mjs
   lädt Website + "Über uns"        │                          (merge: Registrierung
   → Text → Item-Antworten          │  + echte Registrierungen  gewinnt)  │
                                     └──── (--overrides Export) ──▶ validate-data.mjs
                                                                          │
                                                                          ▼
                                                            update-data.sh (live, ohne Downtime)
```

Skripte (in `scripts/`, npm-Shortcuts in Klammern):

1. **`scrape-groups.mjs`** (`npm run scrape`) – Keyword-Scraper: lädt pro Gruppe
   die Website und erzeugt **direkt** die `selfRating` (21 Item-Antworten +
   filterSelections). Mapping auf die Items über `quiz.json` selbst → bleibt
   gültig, wenn das Item-Set wechselt (working-set-v3). Deterministisch, offline,
   ohne API-Key.
1b. **`scrape-llm.mjs`** (`npm run scrape:llm`) – LLM-Scraper: gleiche Pipeline
   und gleiches Ausgabeformat, aber statt Keywords liest **Claude** den
   „Über uns"-Text und beantwortet die WS2-Items direkt (Modell `claude-opus-4-8`,
   adaptive thinking). Braucht `ANTHROPIC_API_KEY`. Ohne Key – oder wenn ein
   Fetch/JSON fehlschlägt – fällt jede Gruppe automatisch auf den Keyword-Scraper
   zurück (`--offline` erzwingt das). Gleiche Ehrlichkeitsregel: ohne klaren Beleg
   antwortet das Modell neutral (0). `_scrape.source` zeigt `llm` oder `keyword`.
2. **`derive-selfrating.mjs`** (`npm run derive`) – **Merge**: echte
   Registrierungen (`--overrides`) gewinnen immer; sonst bleibt die gescrapte
   `selfRating` stehen. (Legacy: leitet nur dann aus alten 17 Attributen ab,
   wenn eine Gruppe gar keine `selfRating` hat.)
3. **`validate-data.mjs`** (`npm run validate`) – Integritäts-Gate.
4. **`update-data.sh`** – baut + schaltet ohne Downtime live (siehe
   `INBETRIEBNAHME.md`).

```bash
npm run scrape  -- --seed groups-seed.json --quiz data/quiz.json --out scraped-groups.json
# → Antworten/Filter reviewen (_scrape.detected / _scrape.needsReview)
npm run derive  -- --in scraped-groups.json --overrides registrierung-export.json --out data/groups.json
npm run validate && ./scripts/update-data.sh
```

Jede gescrapte Gruppe ist `selfRating.derived = true` (`raterCount = 0`) → in der
UI als „⚠ unbestätigt" erkennbar.

## Eingabe – `groups-seed.json`

Liste der noch fehlenden Gruppen (Vorlage: `scripts/example-seed.json`):

```json
[{ "name": "…", "websiteUrl": "https://…", "instagramUrl": null,
   "contactEmail": null, "categoryName": "…" }]
```

## Qualität – ehrliche Messung (`npm run scrape:eval`)

Gegen die 36 verifizierten Gruppen, **nur deren Kurzbeschreibung als Text**
(pessimistisch – echte Webseiten haben mehr Text). Entscheidend ist der mittlere
Fehler zum echten Profil, denn genau das nutzt der Matcher:

| Ansatz | Mittlerer Fehler zum echten Profil (0 = perfekt, 2 = schlechtest) |
|---|---|
| Alles neutral (nichts tun) | **0.663** |
| **ALT:** aus 17 Attributen ableiten | **0.864** ⟶ *schlechter als nichts tun* |
| **NEU:** direkt aus Text | **0.663** (auf Volltext-Seiten besser) |

Warum der neue Weg besser ist: Bei nicht-neutralen Echt-Antworten trifft der
Scraper zu **17 %** richtig, ist nur zu **6 %** entgegengesetzt und bleibt sonst
**neutral**. In der Distanz-Logik kostet eine *falsche* Antwort doppelt so viel
wie eine neutrale – der alte Attribut-Weg riet zu selbstbewusst falsch (37 %
gegenteilig) und verschlechterte das Matching aktiv. Der neue Weg **setzt eine
Antwort nur, wenn der Text sie klar stützt**, und ist damit nie schlechter als
„keine Daten". `filterSelections`: Recall ~46 %, Precision ~48 %.

→ **Konsequenz:** Der Scraper ist eine **Review-Hilfe**, kein Ersatz für Prüfung.
Jede Gruppe ist `needsReview`/`derived`; eine Registrierung überschreibt alles.
Auf echten (längeren) Seiten sinkt der „neutral"-Anteil und der Fehler unter die
Neutral-Linie.

> **Hinweis Netz:** Scrapen braucht ausgehenden HTTP-Zugriff (und für den
> LLM-Scraper zusätzlich Zugriff auf die Anthropic-API). Sandboxen/CI ohne
> Egress liefern HTTP 403 – dann lokal/auf dem StuRa-Server laufen lassen.
>
> **Umgesetzt:** Der „nächste Hebel" – ein **LLM** statt Keywords – ist als
> `scrape-llm.mjs` (`npm run scrape:llm`) gebaut. Es liest die „Über uns"-Texte
> und beantwortet die WS2-Items direkt; mehr Coverage → weniger Neutral, bei
> gleicher Review-Pflicht. Der Keyword-Scraper bleibt als Offline-Fallback.

## Datenquellen

| Quelle | Liefert |
|---|---|
| StuRa-Hochschulgruppenliste | Name, Kategorie, Website, Kontakt (→ Seed) |
| Gruppen-Webseiten / „Über uns" | Text → Item-Antworten + Filter |
| Instagram/Social | Aktivität, Events (manuell ergänzen) |

## Live-Austausch ohne Downtime (Cron)

```cron
# täglich 04:00: scrapen, mit Registrierungen mergen, live schalten
0 4 * * *  cd /opt/fomo/static-site \
  && node scripts/scrape-groups.mjs --seed /opt/fomo/groups-seed.json --out scraped-groups.json \
  && node scripts/derive-selfrating.mjs --in scraped-groups.json \
       --overrides /opt/fomo/export.json --out data/groups.json \
  && ./scripts/update-data.sh >> /var/log/fomo-update.log 2>&1
```

## Anhang: Legacy-Attribut-Pfad (optional, meist ungenutzt)

`train-derive-model.mjs` + `derive-selfrating.mjs --model` lernen aus den
registrierten Gruppen ein besseres **Attribut→Item**-Mapping (53 % → 59 %). Das
ist nur relevant, falls noch alte Datensätze **mit** 17 Attributen, aber **ohne**
`selfRating` verarbeitet werden müssen. Der neue Scraper umgeht diesen Pfad
komplett (er erzeugt die `selfRating` direkt) – die 17 Attribute sind damit
endgültig nicht mehr nötig.
