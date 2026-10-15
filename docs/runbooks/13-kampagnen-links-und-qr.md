<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Kampagnen-Link und QR-Code für Werbung

**Stand: Oktober 2026.** Für Anzeigen (Instagram/Meta), Flyer, Plakate, Giveaways.

## Wie Kampagnen gezählt werden

Umami speichert Seitenaufrufe absichtlich **ohne** den Teil nach dem `?`
(`data-exclude-search` in `static-site/src/components/UmamiScript.tsx`), damit die
Antworten in Ergebnis-Links (`?r=…`) nicht mitgespeichert werden. Darum landen
`utm_*`-Angaben **nicht** als UTM-Felder an den Seitenaufrufen.

Stattdessen sendet `static-site/src/components/CampaignTracker.tsx` beim Ankommen
**ein** anonymes Event **`campaign-visit`** mit `source`, `medium`, `campaign`,
`content` (nur Kleinbuchstaben, Ziffern, `_`, `-`; max. 40 Zeichen) und `path`.
**Auswertung:** Umami → Events → `campaign-visit` → nach `source` bzw. `campaign`
aufschlüsseln. Vor dem Merge dieser Funktion (Oktober 2026) gibt es keine
Kampagnen-Daten; ältere Besuche lassen sich nur grob über Referrer + Landeseite trennen.

## A. Link für eine Online-Anzeige

```
https://www.fomo-dresden.app/quiz/?utm_source=instagram&utm_medium=paid_social&utm_campaign=erstiwoche_ws26
```

- `utm_source` = Plattform, `utm_campaign` = Aktion, optional `&utm_content=story_a`
  um Anzeigen-Varianten zu vergleichen.
- Nur Kleinbuchstaben, Ziffern, `_` und `-` verwenden (alles andere wird entfernt).
- Direkt auf `/quiz/` verlinken, nicht auf die Startseite.

## B. Gedruckter QR-Code (klein, z. B. auf Kondomen)

Für Druck immer einen **Kurzlink** verwenden: kurzer Inhalt = weniger Module =
größere Punkte = auch winzig noch scannbar.

1. Kurzlink in `static-site/vercel.json` unter `redirects` anlegen — groß **und**
   klein, mit und ohne `/` am Ende (Vorlage: `/K` → Kondom-Kampagne).
2. QR erzeugen, Inhalt in GROSSBUCHSTABEN (spart Platz):
   `cd static-site && node scripts/make-qr.mjs "HTTPS://WWW.FOMO-DRESDEN.APP/K" ../marketing/qr/<name>.svg --mm 15`
3. Datei + Zeile in `marketing/qr/README.md` per PR committen.
4. **Nach dem Merge** den Kurzlink im Browser aufrufen: muss auf `/quiz/` landen.
5. **Probedruck in Originalgröße** auf dem echten Material, mit iPhone und Android scannen.

Druckregeln (Details: `marketing/qr/README.md`):
- schwarz auf weiß, nie invertiert, kein Logo, keine abgerundeten Punkte;
- schwarze Fläche ≥ ca. 10–11 mm (≈ 0,4–0,45 mm pro Modul bei 25 × 25 Modulen);
- ringsum ca. 2 mm frei und hell lassen (der weiße Rand muss nicht mitgedruckt
  werden, wenn die Fläche drumherum hell und leer ist); auf Folie matt-weiß unterlegen.

Bewusst **nicht** verwendet:
- **Micro-QR:** wird von den Kamera-Apps der meisten Handys nicht gelesen.
- **bit.ly & Co.:** Jeder Scan liefe über einen US-Dienst mit IP-Protokoll
  (Datenschutz). Außerdem hängen gedruckte Codes dann von dessen Bedingungen ab.
  Kleiner geht es nur mit einer eigenen kurzen Domain (21 × 21 statt 25 × 25
  Module, ca. 15 % Gewinn).

## Bekannte Stolpersteine

- **Instagram-In-App-Browser:** Der sichtbare Bereich ist klein. Deshalb steht der
  „Los geht's“-Knopf auf der Filterseite fest am unteren Rand (seit Oktober 2026,
  vorher lag er ~2 Bildschirme tiefer und 86 % der Instagram-Besucher starteten nicht).
- **Ort der Besucher:** Umami verortet nach IP-Adresse. Mobilfunk-IPs werden oft
  einer anderen Stadt (z. B. Leipzig) zugeordnet; Besucher „aus Leipzig“ heißen also
  nicht zwingend, dass das Meta-Ortsziel falsch ist. In Meta prüfen, ob „Personen, die
  hier wohnen“ statt „… oder kürzlich hier waren“ eingestellt ist.
- **Meta-Link-Vorschau:** Einzelne Besuche aus Prineville (Oregon) sind Meta-Bots.
