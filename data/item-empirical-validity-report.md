# D1 — Item-Empirische-Validitäts-Report
Stand: 2026-05-06

## Methode

- **Datenbasis:** 10 Mitglieder-Sessions aus Pilot (67 total)
- **Übersprungen:** 1 (Gruppe nicht in Profil-DB gefunden)
- **Diskriminierungskraft:** Differenz der mittleren Antworten von Mitgliedern in Gruppen
  mit `attribute=true` vs. `attribute=false`
- **Grenzwert:** |Δ| ≥ 0.15 = 'gut', darunter = 'schwach'

> **Disclaimer:** n=10 ist sehr klein. Alle Befunde sind Hinweise, keine statistischen Belege.
> t-Test-Werte ohne Signifikanzkorrektur (keine Power für Bonferroni bei n=10).

## Ergebnisse

| Item | ShortTitle | Attribut | µ(attr=true) | µ(attr=false) | Δ | n+ | n- | t | Urteil |
|---|---|---|---|---|---|---|---|---|---|
| WS-D4Q3 | Hochschulpolitik | party | 1.000 | 0.556 | 0.444 | 2 | 9 | 3.41 | ✅ gut |
| WS-D7Q3 | Interkulturalität | international | 0.563 | 0.167 | 0.396 | 8 | 3 | 1.78 | ✅ gut |
| WS-D1Q1 | Zeitbudget | timeLow | 0.300 | 0.000 | 0.300 | 10 | 1 | — | ✅ gut |
| WS-D2Q1 | Hands-on | handsOn | 0.786 | 0.500 | 0.286 | 7 | 4 | 1.13 | ✅ gut |
| WS-D4Q4 | Soziales Engagement | socialImpact | 0.700 | 0.500 | 0.200 | 10 | 1 | — | ✅ gut |
| WS-D2Q5 | Konzeptarbeit | handsOn | 0.429 | 0.250 | 0.179 | 7 | 4 | 0.92 | ✅ gut |
| WS-D6Q3 | Nachhaltigkeit | socialImpact | 0.650 | 0.500 | 0.150 | 10 | 1 | — | ✅ gut |
| WS-D8Q3 | Kompetitivität | competitive | 0.500 | 0.500 | 0.000 | 3 | 8 | 0.00 | ⚠️ schwach |
| WS-D9Q4 | Analog statt Digital | outdoor | 1.000 | 1.000 | 0.000 | 3 | 8 | — | ⚠️ schwach |
| WS-D5Q5 | Kreativität | arts | 0.000 | 0.222 | -0.222 | 2 | 9 | -2.53 | ✅ gut |
| WS-D1Q5 | Führungsrolle | leadershipOpportunities | 0.773 | — | — | 11 | 0 | — | ❓ keine Daten |
| WS-D3Q1 | Freundschaften | networking | 0.773 | — | — | 11 | 0 | — | ❓ keine Daten |
| WS-D3Q4 | Neue Leute kennenlernen | networking | 0.636 | — | — | 11 | 0 | — | ❓ keine Daten |
| WS-D10-NEW | Einstiegsfreundlich | beginnerFriendly | — | — | — | 0 | 0 | — | ❓ keine Daten |
| WS-S1 | Altruismus | socialImpact | — | — | — | 0 | 0 | — | ❓ keine Daten |
| WS-S2 | Zielorientierung | competitive | — | — | — | 0 | 0 | — | ❓ keine Daten |
| WS-S3 | Outdoor | outdoor | — | — | — | 0 | 0 | — | ❓ keine Daten |

## Problematische Items (schwache Diskriminierung)

### WS-D8Q3 — "Kompetitivität"

- **Text:** "Ich möchte in Rankings, Bestenlisten oder Meisterschaften auftreten."
- **Mapping:** `competitive` (isInverse: false)
- **Δ:** 0.000 (n+=3, n-=8)
- **Handlungsempfehlung:** prüfen ob Item wirklich `competitive` misst oder ob Wording überarbeitet werden sollte

### WS-D9Q4 — "Analog statt Digital"

- **Text:** "Analoge Aktivitäten ziehe ich digitalen vor."
- **Mapping:** `outdoor` (isInverse: false)
- **Δ:** 0.000 (n+=3, n-=8)
- **Handlungsempfehlung:** prüfen ob Item wirklich `outdoor` misst oder ob Wording überarbeitet werden sollte

## Items ohne Datenbasis

Für diese Items gibt es keine Mitglieder-Sessions aus Gruppen mit bekanntem Attribut-Wert:

- **WS-D1Q5** (Führungsrolle) → Attribut: leadershipOpportunities
- **WS-D3Q1** (Freundschaften) → Attribut: networking
- **WS-D3Q4** (Neue Leute kennenlernen) → Attribut: networking
- **WS-D10-NEW** (Einstiegsfreundlich) → Attribut: beginnerFriendly
- **WS-S1** (Altruismus) → Attribut: socialImpact
- **WS-S2** (Zielorientierung) → Attribut: competitive
- **WS-S3** (Outdoor) → Attribut: outdoor

