# Aufgabe: Inverse Items in der Statistik-Berechnung überprüfen

## Kontext

Wir haben eine Pilot-Umfrage mit 59 Fragen (10 Dimensionen + 3 Standalone). Manche Fragen sind invers codiert (`isInverse: true` in der DB). Das heißt: "Stimme zu" (Wert 5) zeigt in die Gegenrichtung der Dimension.

Für die Berechnung von **r_it** (korrigierte Item-Total-Korrelation) und **Cronbach's Alpha** müssen inverse Items umgepolt werden: `invertiert = 6 - original` (also 1→5, 3→3, 5→1).

## Inverse Items in der DB

Diese Fragen haben `isInverse: true`:
- D2Q5, D2Q6 (Dimension: Hands-on, hoher Wert = praktisch)
- D3Q5 (Dimension: Geselligkeit, hoher Wert = Leute & Spaß)
- D4Q6 (Dimension: Politik, hoher Wert = engagiert)
- D9Q3, D9Q4 (Dimension: Digital, hoher Wert = digital)
- D10Q2, D10Q3 (Dimension: Einstieg, hoher Wert = will niedrigschwellig)

## Was du prüfen sollst

1. **Finde den Code der r_it berechnet.** Wird dort vor der Berechnung geprüft ob `isInverse === true` ist, und wenn ja, der Wert invertiert (6 - value)? Oder werden die Rohwerte direkt verwendet?

2. **Finde den Code der Cronbach's Alpha berechnet.** Gleiches: Werden inverse Items umgepolt bevor die Varianz und Korrelation berechnet wird?

3. **Finde den Code der die Verteilung (Distribution) berechnet.** Hier soll NICHT invertiert werden — die Verteilung zeigt die tatsächlichen Antworten (wie viele haben Nein/Egal/Ja gesagt).

4. **Finde den Code der den Mittelwert berechnet.** Hier muss entschieden werden: Zeigt der Mittelwert den invertierten Wert (= in Dimensionsrichtung) oder den Rohwert? Empfehlung: Invertiert anzeigen, damit M konsistent mit der Dimension ist (hoher M = hoher Dimensionswert).

5. **Prüfe ob das `isInverse` Flag aus der DB gelesen wird.** In der API-Route `/api/admin/pilot/statistics` (oder wo auch immer die Statistik berechnet wird): Wird `isInverse` von `PilotSurveyQuestion` geladen und verwendet?

## Erwartetes Verhalten

```
Beispiel: D4Q6 "Ich bevorzuge Gruppen ohne Politik" (isInverse: true)
Jemand antwortet "Stimme zu" (value = "5")

Für Verteilung:     Zähle als "5" (Ja) → korrekt, zeigt echte Antwort
Für Mittelwert:     Invertiere zu 1 → niedrig = wenig politisch engagiert ✓
Für r_it:           Invertiere zu 1 → korreliert positiv mit D4Q1-Q5 ✓
Für Alpha:          Invertiere zu 1 → konsistente Varianzberechnung ✓
```

## Was du tun sollst

1. Lies den relevanten Code
2. Prüfe ob die Inversions-Logik korrekt implementiert ist
3. Falls nicht: Fixe es
4. Falls ja: Bestätige es mit einem konkreten Beispiel aus dem Code

Schau besonders in:
- `/src/app/api/admin/pilot/statistics/route.ts` (oder ähnlich)
- `/src/lib/queries/pilot.ts`
- Jede Datei die `correctedItemTotal`, `cronbachAlpha`, `pearson` oder ähnliche Funktionen enthält
