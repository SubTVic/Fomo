# Group Verification Deploy Checklist
Stand: 2026-05-05

## Status der Implementierung

Das Token-System ist vollständig implementiert. Alle Kernteile existieren und sind integriert.

### Was deployed ist (Code vollständig):

- [x] **Token-Generierung** — `/api/admin/groups/invites` (POST, bulk-fähig, 32-char hex token, konfigurierbares Ablaufdatum)
- [x] **Admin-UI: Token versenden** — `GenerateInvitesButton.tsx` + `InviteButton.tsx` im Admin-Panel
- [x] **Registrierungs-Page** — `/groups/register?token=<hex>` (öffentlich erreichbar, kein Login)
- [x] **AttributeChecklist** — zeigt Scraper-Vorausfüllung, Gruppen können bestätigen/korrigieren
- [x] **Submit-API** — `/api/groups/register-attributes` (POST: Token validieren → Attribute überschreiben → Status SUBMITTED)
- [x] **Admin-Verifikation** — `VerifyButton.tsx` + `/api/admin/groups/[id]/verify` (Status → VERIFIED, isVerified=true)
- [x] **Token Replay-Schutz** — `updateMany { usedAt: null }` Pattern (atomare Claim-Logik, M2-Fix)
- [x] **APP_MODE** — `process.env.APP_MODE` steuert Landing Page (pilot/collect/live), kein Code-Umbau nötig

### Was noch fehlt / geprüft werden muss:

- [ ] **Smoke-Test auf Staging** — Token generieren → Link öffnen → Attribute bestätigen → in DB landen → Admin sieht SUBMITTED
- [ ] **E-Mail-Versand** — Die API gibt Tokens zurück (CSV-Format), aber verschickt keine Mails automatisch. Outreach läuft manuell (Victor kopiert Link in E-Mail). Wenn automatischer Versand gewünscht: Email-Provider einbinden (Resend, Postmark o.ä.)
- [ ] **APP_MODE in Vercel setzen** — Aktuell wahrscheinlich noch "pilot". Für Verifikations-Phase auf "collect" setzen: `APP_MODE=collect` in Vercel Environment Variables
- [ ] **Token-Ablaufzeit** — Default 30 Tage. Für erste Welle: passt. Bei langen Wellen ggf. verlängern.

## Smoke-Test Plan

Manuell mit 2 Test-Tokens (z.B. für Elbflorace und YETI):

1. **Token generieren**
   - Admin-Panel → Gruppen → "Einladungen generieren"
   - Oder direkt via API: `POST /api/admin/groups/invites` mit `[{groupId, email, expiresInDays: 30}]`
   - Output: `{"token": "abc123...", "expiresAt": "..."}`

2. **Link öffnen**
   - URL: `https://<deployment-url>/groups/register?token=abc123...`
   - Erwartung: Formular lädt, zeigt Gruppen-Name + Scraper-Vorausfüllung (Attribute checkboxes)
   - Fehlerfall prüfen: abgelaufener Token → "Abgelaufen"-Meldung; ungültiger Token → 404-Meldung

3. **Attribute bestätigen**
   - Einige Attribute ändern, Submit klicken
   - Erwartung: "Danke"-Bestätigung

4. **Replay-Schutz testen**
   - Selben Link nochmal öffnen → Meldung "Bereits verwendet"

5. **DB-Check**
   - Admin-Panel → Gruppe → Status sollte "Eingereicht" zeigen
   - Admin kann dann manuell "Verifizieren" klicken → Status → "Verifiziert"

6. **Build-Sichtbarkeit prüfen**
   - Nach Verifikation: prüfen ob Matching-Algorithmus die neuen Attribut-Werte aus der DB lädt (Quiz-Seite → Matching-Ergebnis neu prüfen)

## APP_MODE umschalten

```bash
# In Vercel Dashboard: Settings → Environment Variables
# Oder via Vercel CLI:
vercel env add APP_MODE
# → Wert: "collect"
# → Environment: Production
# Danach: Redeploy auslösen
```

Bedeutung der Modi:
- `pilot` — Landing Page zeigt Pilot-CTA ("Zur Pilotstudie")
- `collect` — Landing Page zeigt Collect-CTA für Gruppenverifikation
- `live` — Landing Page zeigt Live-Quiz-CTA

## Bekannte Edge Cases (bereits implementiert)

| Fall | Handling |
|---|---|
| Token bereits verwendet | HTTP 409, Fehlermeldung im Formular |
| Token abgelaufen | HTTP 410, Fehlermeldung |
| Token nicht gefunden | HTTP 404 |
| Gruppe existiert nicht | HTTP 422 (Fremdschlüssel-Fehler abgefangen) |
| Parallele Requests mit demselben Token | `updateMany { usedAt: null }` — nur einer gewinnt |

## Noch ungetestete Edge Cases

- Was passiert, wenn eine Gruppe bereits SUBMITTED ist und ein zweiter Token generiert wird? → Admin kann neuen Token erstellen, Gruppe kann erneut submitten (Status wird wieder SUBMITTED, isVerified=false)
- Was passiert, wenn das Formular mit 0 Attributen submitted wird? → Zod-Validation erlaubt leeres `confirmedAttributes` — keine Pflichtfelder. Gruppen können alle Attribute auf 0 setzen. Ist das intendiert?

## Empfohlene nächste Schritte

1. Smoke-Test auf Staging mit 2 echten Gruppen-Tokens (Aufwand: 30 Min)
2. APP_MODE=collect in Vercel setzen
3. Victor generiert 30 Tokens für erste Welle
4. Manueller Outreach via E-Mail (Token-Link einfügen)
5. Ziel: 30 verifizierte Profile in 4 Wochen
