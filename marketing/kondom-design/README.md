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

Geprüft mit zwei Decodern (jsQR und ZXing, der Bibliothek vieler Scanner-Apps) in
verschiedenen Größen, unscharf und schräg. ZXing liest alle Varianten in 11 von 12
Fällen (ein schlichter QR-Code ohne Deko: 12 von 12) – nur extreme Unschärfe/
Schräglage scheitert.


- Fehlerkorrektur **H** (30 % Reserve) – das „FOMO“-Label deckt nur ~6 % ab.
  Größere Labels (ab ~2,4 mm Schrifthöhe) haben im Test die Reserve aufgefressen:
  **Label nicht vergrößern.**
- Herzen in den Ecken füllen das Ecken-Auge fast ganz aus; kleinere Herzen
  scannten im Test schlechter.
- Weiße Fläche hinter dem QR-Code (inkl. 4 Module Rand) – auf Folie **weiß drucken
  lassen**, nicht transparent. Code-Farbe dunkel (navy), nie hell auf dunkel.
- QR 24 × 24 mm (0,83 mm pro Modul) – das Motiv füllt die 50 × 50 mm fast randlos
  (48,6 × 49,3 mm), Schrift und Stecker reichen bis an den Rand.

**Wichtig für die Druckerei:** Weil das Motiv bis an den Rand geht, fragen, ob die
Druckfläche wirklich 50 × 50 mm ist oder ob ein Sicherheitsabstand (z. B. zur
Siegelnaht) gilt. Falls ja: in `export.mjs` die Seitengröße auf die echte
Druckfläche setzen oder das PDF passend verkleinert platzieren lassen.

## Vor der Bestellung

1. Probedruck/Proof in Originalgröße mit **iPhone und Android** scannen.
2. Fragen, ob die Druckerei Weiß unterlegen kann; Farben ggf. als Pantone/CMYK abstimmen.
3. Nicht skalieren oder verzerren; nichts über den weißen Bereich drucken.

## Stecker und Steckdose

Handgezeichnete Vorlagen `icons/stecker-vorlage.jpg` und `icons/dose-vorlage.jpg`,
in Vektorpfade umgewandelt (`icons/*.json`). Die Kabel hängen **nahtlos an den
Enden der Ringlinie**: `icons/*.json` enthält zusätzlich die Kabel-Mittellinie
(`cable`) und -breite (`cableWidthPx`), auf dem Originalbild gemessen;
`generate.mjs` dreht jede Zeichnung so, dass das Kabel genau am Linienende in
Ringrichtung weiterläuft, und füllt das hohle Kabel massiv wie die Linie.
Größe: `ICONS` (`scale`), Position am Ring: `PHI`.

Andere Zeichnung (schwarz auf weiß, Kabel läuft am Bildrand heraus): Bild ersetzen,
mit potrace umwandeln (`npm i potrace@2.1.8`, `threshold: 128, turdSize: 40` →
`w`, `h`, `d` als JSON) und die Kabel-Mittellinie neu messen.

## Neu erzeugen / ändern

```
npm i opentype.js@1.3.4 @fontsource/archivo-black@5.0.19 @fontsource/lexend@5.0.21 qrcode-generator@2.0.4
node generate.mjs <ordner> "#1a2a35" navy
```
node export.mjs <ordner> navy pink gold weiss   # randlos einpassen + PDF/PNG/Vorschau (braucht playwright)
```
(in einem temporären Ordner installieren). `export.mjs` misst das fertige Motiv und
schneidet den leeren Rand weg, sodass das äußerste Element den Bildrand berührt.
```
Nach jeder Änderung den Code erneut mit Handys testen.
