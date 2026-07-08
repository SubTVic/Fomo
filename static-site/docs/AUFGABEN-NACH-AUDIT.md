<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Nächste Schritte nach dem Audit (Juli 2026) — für Admins

Die **Code-Aufgaben aus dem Audit sind erledigt** (faire Gleichstand-Anzeige,
Suche auf /groups, Sprachumschalter überall, „Antworten ändern", Filter-Hinweis,
natives Teilen). Was hier steht, sind die **Nicht-Code-Aufgaben** — bewusst so
aufbereitet, dass sie ohne Programmierkenntnisse machbar sind. Reihenfolge =
Wirkung pro Aufwand.

---

## 1. Umami scharfschalten (15 Min) — sonst ist /report/ nur Simulation

Vercel → **static-site-Projekt** → Settings → Environment Variables → zwei
Variablen anlegen (Environment: Production):

| Name | Wert |
|---|---|
| `UMAMI_API_KEY` | dein Umami-Cloud-API-Key |
| `UMAMI_WEBSITE_ID` | `56708403-b68d-4f0a-957b-55d9b68b9ff0` |

Dann Deployments → letztes Deployment → ⋯ → **Redeploy**. Danach zeigt
www.fomo-dresden.app/report/ echte Zahlen. (Details + Montags-Auto-Refresh:
Betriebshandbuch §7.)

---

## 2. Drei doppelte Gruppen bereinigen (15 Min) — der einzige für Nutzer sichtbare Fehler

In der **Registrierungs-/Admin-App** (dynamische App, nicht die statische Seite)
je **eine** Kopie deaktivieren, dann neu exportieren
(`node scripts/export-from-backup.mjs …` → `groups.json` committen).

| Behalten ✅ | Deaktivieren ❌ | Warum |
|---|---|---|
| `rotaract-club-dresden` (dresden-vorstand@rotaract.de) | `rotaract-club-dresden-2` (felix.a.mack@…) | **Wichtigster Fall: beide sind verifiziert und konkurrieren im Quiz.** Offizielle Vorstands-Mail behalten. |
| `technische-universitaet-dresden-robotik-arbeitsgruppe` (verifiziert, 3 Bewertungen) | `tu-dresden-robotik-ag-turag` (unbestätigt) | Verifizierte Kopie ist besser. Das Logo ist schon auf beide Slugs verankert, bleibt also sichtbar. |
| `kritmed` | `kritmed-dresden` | Beide unbestätigt — egal welche; nimm die, unter der die Gruppe erreichbar ist. |

> Am saubersten fragst du Rotaract kurz, welche der zwei Anmeldungen die
> „echte" ist — beide wurden offenbar getrennt registriert.

---

## 3. Neun Gruppen ohne Aktivitäts-Filter (E-Mail-Runde) — behebt den größten Bias

**Warum:** Diese Gruppen haben keine Aktivitäts-Filter angegeben und können
deshalb **nie weggefiltert werden** → sie erscheinen ~1,8× so oft in den
Ergebnissen wie fair wäre. Die Lösung ist keine Programmierung, sondern
**eine Angabe pro Gruppe**.

Die 8 möglichen Filter (Gruppe wählt die zutreffenden):
Hands-on/Werkstatt · Kunst (Theater/Film/Design/Foto) · Wettbewerbe ·
Musik · Outdoor/Natur · Tech/Digital · Hochschulpolitik · Sport.

Betroffene Gruppen (Mail schon herausgesucht):

| Gruppe | Kontakt |
|---|---|
| AufeinanderAchten | info@aufeinanderachten.de |
| Effektiver Altruismus | dresden@effektiveraltruismus.de |
| FIRST AID FOR ALL – Dresden | firstaidforall.dresden@mailbox.tu-dresden.de |
| HSG Grundvorlesung ökologische Nachhaltigkeit | vl.sustainability@tu-dresden.de |
| Heinrich-Cotta-Club e.V. | *(keine Mail hinterlegt — über Website kontaktieren)* |
| Hochschul-SMD Dresden | dresden@smd.org |
| Leo-Club Dresden 'August der Starke' | augustderstarke@leo-clubs.de |
| Nightline Dresden e.V. | marketing@nightline-dresden.de |
| VWI HG Dresden e.V. | vorstand@vwi-dresden.de |

**Fertige E-Mail-Vorlage:**

> Betreff: Kurze Rückfrage zu eurem FOMO-Profil (1 Minute)
>
> Hallo liebe [Gruppenname],
>
> ihr seid auf FOMO gelistet (www.fomo-dresden.app) — dem Quiz, das Erstis
> passende Hochschulgruppen vorschlägt. Damit euch die richtigen Leute finden,
> fehlt uns noch **eine** Angabe: In welche dieser Aktivitäts-Kategorien passt
> ihr? (Mehrfachauswahl, gern auch „keine davon")
>
> ☐ Hands-on/Werkstatt ☐ Kunst & Kultur ☐ Wettbewerbe ☐ Musik
> ☐ Outdoor & Natur ☐ Tech & Digital ☐ Hochschulpolitik ☐ Sport
>
> Einfach zurückschreiben, wir tragen es ein. Danke!
>
> Viele Grüße, das FOMO-Team

Antworten dann in der Admin-App bei der Gruppe eintragen → neu exportieren.

---

## 4. Datenpflege-Kampagne (laufend) — der eigentliche Qualitäts-Hebel

- **62 von 92 Gruppen stehen in „Sonstiges".** Jede korrekt zugeordnete
  Kategorie füllt die SEO-Kategorieseite und macht den Browse-Filter nützlich.
- **Nur 11 Logos, 27 Mitgliederzahlen, 0 gepflegte „Nächstes Event".** Beim
  Registrierungs-Kontakt gleich mit abfragen.
- **38 von 92 verifiziert.** Jede weitere Registrierung verbessert das Matching
  mehr als jede Code-Änderung — der wichtigste Launch-Hebel vor der Erstiwoche.

---

## 5. Betrieb absichern (einmalig, je 5 Min)

- **Uptime-Monitor:** kostenloser Dienst (z. B. UptimeRobot) auf
  www.fomo-dresden.app → mailt dir bei Ausfall (Domain/Deploy), bevor
  Studierende es merken.
- **Google Search Console:** Domain verifizieren + Sitemap
  `https://www.fomo-dresden.app/sitemap.xml` einreichen → Gruppenprofile und
  Kategorieseiten kommen schneller in die Suche.
- **Vorschau nutzen:** Vercel baut für jeden Pull Request eine eigene
  Vorschau-URL — Änderungen dort ansehen, bevor sie auf `main` live gehen.
