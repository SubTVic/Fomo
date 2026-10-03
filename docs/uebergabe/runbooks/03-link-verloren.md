<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Gruppe hat ihren Bearbeitungslink verloren / abgelaufen

**Kurz:** Einen neuen Link kann **nur ein Admin** erzeugen. Die App verschickt keine
Mails, es gibt keinen „Link neu anfordern"-Knopf für die Gruppe, und alte Links lassen
sich nicht wieder anzeigen. Ein Link ist **einmalig** nutzbar und **30 Tage** gültig.

## Schritte

1. In der Admin-App einloggen (fomo-pi.vercel.app/admin). Ohne Login: ein SUPER_ADMIN
   muss unter „Admins" ein Konto (Rolle „Editor" reicht) anlegen.
2. „Gruppen" → die Gruppe suchen → **„Einladen" → „Link erstellen"**.
3. Den angezeigten Link **sofort kopieren** (erscheint nur einmal). Form:
   `https://fomo-pi.vercel.app/groups/register?token=…`
4. Den Link **selbst per Mail** an die Gruppe schicken — nur an eine hinterlegte
   Adresse. Der Link wirkt wie ein Passwort, nicht weiterleiten.
5. Nach dem Absenden durch die Gruppe: **verifizieren** + Daten live schalten
   (siehe Runbook 01).

## Mustertext für die Mail

> Betreff: Neuer Link für euer FOMO-Profil
>
> Hallo [Gruppe], hier ist euer neuer Link zum Bearbeiten: [LINK]. Eure bisherigen
> Antworten sind schon eingetragen — ändert einfach, was nicht mehr passt, und schickt
> am Ende ab (ca. 5 Minuten). Der Link gilt 30 Tage und funktioniert nur einmal, bitte
> nicht weiterleiten. Danach prüfen wir kurz und spielen die Änderung auf
> www.fomo-dresden.app ein. Viele Grüße, das FOMO-Team

## Fallen

- **Das Skript `scripts/generate-invites.ts` NICHT für Einzelfälle benutzen** — es
  braucht eine Kontaktliste außerhalb des Repos und gibt teils bereits benutzte (tote)
  Tokens erneut aus. Für einen einzelnen neuen Link immer die Admin-UI nehmen.
- Mehrere Links pro Gruppe können gleichzeitig gültig sein; alte werden nicht
  zurückgezogen. Kein Problem, aber gut zu wissen.
- Nach erfolgreichem Absenden ist der Link verbraucht — für die nächste Änderung
  braucht es wieder einen neuen.

## Nach dem Umbau (Audit-Vorschlag A3)

Ein **dauerhafter**, pro Gruppe stabiler Bearbeitungslink plus eine Seite „Link neu
zuschicken" macht dieses Runbook überflüssig.
