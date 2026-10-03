<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Admin hinzufügen, entfernen, Passwort zurücksetzen

**Stand: Oktober 2026.**

## Rollen

- **SUPER_ADMIN:** alles. **Nur** SUPER_ADMINs dürfen: Backup herunterladen, Gruppen
  löschen, Gruppen zusammenführen, Admins verwalten.
- **EDITOR:** Gruppen bearbeiten, verifizieren, aktivieren/deaktivieren, Bearbeitungslinks
  erzeugen, Änderungen ansehen/rückgängig machen, Kontakte ansehen.

Es sollte immer **mindestens zwei** aktive SUPER_ADMINs geben (Urlaub, Weggang).

## Schritte (nur als SUPER_ADMIN)

1. Admin-App → **„Admins"** (fomo-pi.vercel.app/admin/users).
2. **Neu:** „Neuen Admin erstellen" → E-Mail, Name, Startpasswort (≥ 8 Zeichen), Rolle →
   Passwort der Person auf getrenntem Weg mitteilen.
3. **Entfernen:** Bei Weggang zuerst über „Admin bearbeiten" **deaktivieren** (wirkt
   sofort, auch bei offener Sitzung), später „Admin löschen".
4. **Passwort vergessen:** „Passwort zurücksetzen" bei der Person.

**Login-Sperre:** Nach 5 falschen Passwörtern innerhalb von 15 Minuten ist die
E-Mail-Adresse für 15 Minuten gesperrt (Meldung „Zu viele Fehlversuche"). Einfach
abwarten; danach zählt es neu. Groß-/Kleinschreibung der E-Mail spielt beim Login
keine Rolle.

Der **letzte aktive SUPER_ADMIN** kann nicht gelöscht, deaktiviert oder herabgestuft
werden — die App verweigert das mit einer Meldung.

## Notfall: niemand hat mehr SUPER_ADMIN-Zugang

Dann hilft nur Zugriff auf die Datenbank (Person mit DB-Zugang beim Hosting): einen
bestehenden Admin per SQL auf `role = 'SUPER_ADMIN'`, `"isActive" = true` setzen.
Vorher ein Backup ziehen. Wer DB-Zugang hat, steht in der Übergabe-Dokumentation.
