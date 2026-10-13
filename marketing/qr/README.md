<!-- SPDX-License-Identifier: AGPL-3.0-only -->
# QR-Codes für Werbemittel

| Datei | Inhalt | Ziel |
|---|---|---|
| `fomo-qr-kondom.svg` / `.png` | `HTTPS://WWW.FOMO-DRESDEN.APP/K` | Weiterleitung (`static-site/vercel.json`) auf `/quiz/?utm_source=kondom&utm_medium=print&utm_campaign=erstiwoche_ws26` |

Neu erzeugen: `cd static-site && node scripts/make-qr.mjs "HTTPS://WWW.FOMO-DRESDEN.APP/K" ../marketing/qr/fomo-qr-kondom.svg --mm 15`

## Damit der Code auch winzig scannbar bleibt

- **Kurzer Inhalt:** nur der Kurzlink `/K`, nicht die lange UTM-Adresse
  (25×25 statt 41×41 Module → Module bei gleicher Größe ~50 % größer).
- **GROSSBUCHSTABEN:** werden platzsparender kodiert (alphanumerischer Modus).
  Ein neuer Kurzlink muss deshalb in `vercel.json` groß **und** klein eingetragen sein.
- **Größe:** Gesamtbreite inkl. weißem Rand ≥ 13 mm (≈ 0,4 mm pro Modul), besser 15 mm.
  Den weißen Rand (4 Module) **nicht** wegschneiden oder überdrucken.
- **Druck:** schwarz (oder sehr dunkel) auf weiß/hell, nie invertiert. Auf Folie
  eine matte weiße Fläche unterlegen; kein Logo, keine Effekte.
- Vor der Bestellung **Probedruck in Originalgröße** mit iPhone und Android testen.
