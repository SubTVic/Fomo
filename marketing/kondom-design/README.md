<!-- SPDX-License-Identifier: AGPL-3.0-only -->
# Kondom-Design „Connect with the right people“

Druckvorlage 50 × 50 mm, vier Farbvarianten des „FOMO“-Labels (navy, pink, gold, weiss).
QR-Inhalt: `HTTPS://WWW.FOMO-DRESDEN.APP/K` → Quiz mit `utm_source=kondom`
(Kurzlink in `static-site/vercel.json`, Auswertung: Event `campaign-visit`).

| Datei | Wofür |
|---|---|
| `fomo-kondom-<farbe>.pdf` | **an die Druckerei** (Vektor, 50 × 50 mm, Schrift in Pfaden) |
| `fomo-kondom-<farbe>.svg` | Vektor zum Weiterbearbeiten (Illustrator, Inkscape, Affinity) |
| `fomo-kondom-<farbe>.png` | 600 dpi, transparenter Hintergrund – für Shops, die nur PNG nehmen |
| `vorschau.png` | Ansicht aller vier Varianten auf blauer Folie |

## Warum nicht einfach ein KI-Bild?

Bildgeneratoren malen nur QR-ähnliche Muster – die Codes in solchen Bildern
**lassen sich nicht scannen**. Diese Vorlage enthält einen echten QR-Code, erzeugt
von `generate.mjs`.

## Was den Code trotz Deko scannbar hält (getestet)

- Fehlerkorrektur **H** (30 % Reserve) – das „FOMO“-Label deckt nur ~6 % ab.
  Größere Labels (ab ~2,4 mm Schrifthöhe) haben im Test die Reserve aufgefressen:
  **Label nicht vergrößern.**
- Herzen in den Ecken füllen das Ecken-Auge fast ganz aus; kleinere Herzen
  scannten im Test schlechter.
- Weiße Fläche hinter dem QR-Code (inkl. 4 Module Rand) – auf Folie **weiß drucken
  lassen**, nicht transparent. Code-Farbe dunkel (navy), nie hell auf dunkel.
- QR 20 × 20 mm, 0,69 mm pro Modul.

## Vor der Bestellung

1. Probedruck/Proof in Originalgröße mit **iPhone und Android** scannen.
2. Fragen, ob die Druckerei Weiß unterlegen kann; Farben ggf. als Pantone/CMYK abstimmen.
3. Nicht skalieren oder verzerren; nichts über den weißen Bereich drucken.

## Neu erzeugen / ändern

```
npm i opentype.js@1.3.4 @fontsource/archivo-black@5.0.19 @fontsource/lexend@5.0.21 qrcode-generator@2.0.4
node generate.mjs <ordner> "#1a2a35" navy
```
(in einem temporären Ordner installieren; PDF/PNG danach per Browser-Export).
Nach jeder Änderung den Code erneut mit Handys testen.
