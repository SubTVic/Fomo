# Bug-Audit: FOMO Codebase

## Deine Rolle

Du bist ein Senior QA-Ingenieur und Security-Reviewer, beauftragt mit einem vollständigen Bug-Audit einer Next.js 15 Webapp. Du wirst dafür bezahlt, Fehler zu finden — nicht dafür, den Code zu loben. Jeder Bug, den du übersiehst und der in Produktion landet, kostet das Team Wochen.

**Guter Output:** "In `/api/admin/groups/[id]/route.ts` Zeile 34: Die PUT-Route prüft nicht ob die Gruppe existiert bevor sie updated. Wenn eine nicht-existente ID übergeben wird, wirft Prisma einen P2025-Error der nicht gefangen wird → 500 Internal Server Error statt 404."

**Schlechter Output:** "Es könnte Edge Cases geben." — Das ist keine Hilfe. Sag genau wo, was, und warum.

## Tech-Stack

- Next.js 15 (App Router, TypeScript)
- Prisma ORM + PostgreSQL
- Auth.js (NextAuth v5) mit Credentials Provider
- Tailwind CSS v4 + shadcn/ui

## Was du prüfen sollst

Gehe systematisch durch die gesamte Codebase. Für jeden Fund: **Datei + Zeile → Was passiert → Warum ist es ein Problem → Severity (Critical/High/Medium/Low).**

---

### 1. API-Routen — Alle durchgehen

Prüfe jede Route in `src/app/api/`:

**Auth & Autorisierung:**
- Prüfen alle geschützten Routen die Session? Gibt es Routen die `auth()` vergessen?
- Kann ein normaler EDITOR Admin-only-Aktionen ausführen (z.B. andere Admins löschen)?
- Kann ein nicht-authentifizierter User geschützte Routen erreichen?

**Input-Validierung:**
- Werden alle Request-Bodies validiert (z.B. mit Zod)? Oder werden Felder direkt aus `req.json()` in Prisma geschrieben?
- Was passiert bei fehlenden Feldern, falschen Typen, leeren Strings, extrem langen Strings?
- Werden IDs aus URL-Parametern validiert bevor sie an Prisma gehen?

**Error-Handling:**
- Werden Prisma-Errors gefangen? (P2002 unique constraint, P2025 record not found, P2003 foreign key)
- Gibt es unhandled Promise rejections?
- Werden interne Fehlermeldungen an den Client geleaked?

**Datenintegrität:**
- Kann man über die API Daten in einen inkonsistenten Zustand bringen?
- Was passiert wenn man eine Dimension löscht die noch Fragen hat?
- Was passiert wenn man eine Frage löscht auf die noch PilotAnswers verweisen?
- Kann man doppelte Antworten für dieselbe Session+Frage erstellen?

**Routen-Liste (alle prüfen):**
```
/api/auth/[...nextauth]/route.ts
/api/groups/register/route.ts
/api/admin/import-groups/route.ts
/api/admin/groups/pending/route.ts
/api/admin/groups/[id]/route.ts
/api/admin/groups/[id]/verify/route.ts
/api/admin/questions/route.ts
/api/admin/questions/[id]/route.ts
/api/admin/users/route.ts
/api/admin/users/[id]/route.ts
/api/admin/users/[id]/password/route.ts
/api/admin/pilot/dimensions/route.ts
/api/admin/pilot/dimensions/[id]/route.ts
/api/admin/pilot/survey-questions/route.ts
/api/admin/pilot/survey-questions/[id]/route.ts
/api/pilot/submit/route.ts
/api/pilot/export/route.ts
/api/pilot/admin-export/route.ts
```

---

### 2. Pilot Survey — Datenfluss

Der kritischste User-Flow: Studis füllen die Umfrage aus.

- **Submit-Route:** Werden die Antworten korrekt validiert? Was passiert bei value "2" oder "99" oder "" oder null?
- **Session-Erstellung:** Kann man mehrfach submitten und dadurch Duplikate erzeugen?
- **Varianten-System:** Werden alle 59 Fragen tatsächlich angezeigt? Kann es passieren dass Fragen fehlen oder doppelt erscheinen durch das Block/Varianten-Shuffling?
- **Antwort-Speicherung:** Werden "0" (Keine Angabe) korrekt gespeichert und in der Statistik als Missing behandelt?
- **Abbruch:** Was passiert wenn jemand nach 30 Fragen den Browser schließt? Wird die Session korrekt als "nicht abgeschlossen" gespeichert oder gibt es Datenmüll?

---

### 3. Statistik-Berechnungen

- **Division by Zero:** Was passiert bei 0 Antworten, 1 Antwort, 2 Antworten? Mittelwert, SD und Pearson brauchen Mindestanzahlen.
- **Inverse Items:** Werden sie korrekt umgepolt (6 - value) für r_it und Alpha aber NICHT für die Verteilungsanzeige?
- **NaN/Infinity:** Können Berechnungen NaN oder Infinity zurückgeben? (z.B. SD bei 0 Varianz, Pearson bei konstanten Werten)
- **Standalone-Items:** Werden Fragen mit `dimensionId: null` korrekt von den Dimensions-Berechnungen ausgeschlossen?

---

### 4. Client-Side Bugs

**State-Management:**
- Gibt es Race Conditions im Survey-State? (z.B. doppeltes Absenden, schnelles Klicken)
- Gehen Antworten verloren bei Navigation zwischen Varianten/Blöcken?
- Funktioniert der Back-Button korrekt oder zerstört er den State?

**Hydration:**
- Gibt es Server/Client-Mismatches? (z.B. `Math.random()` für Varianten-Reihenfolge auf dem Server)
- Werden Dates/Timestamps konsistent zwischen Server und Client gehandelt?

**UI/UX Bugs:**
- Kann man die Umfrage absenden ohne alle Pflichtfragen beantwortet zu haben?
- Funktioniert die Umfrage auf Mobile korrekt? (Touch-Events bei Swipe-Variante, Viewport-Probleme)
- Gibt es Layout-Shifts oder Flicker beim Laden?

---

### 5. Security

- **SQL Injection:** Prisma parametrisiert automatisch, aber gibt es Raw Queries?
- **XSS:** Werden User-Inputs (Feedback-Freitext, Gruppenname bei Registrierung) korrekt escaped?
- **CSRF:** Sind die API-Routen gegen CSRF geschützt?
- **Auth-Bypass:** Kann man die Admin-Routen ohne Login erreichen? Werden Bearer-Tokens für den Export sicher gehandhabt?
- **Rate-Limiting:** Gibt es Schutz gegen Spam-Submissions bei der Pilot-Umfrage und Gruppen-Registrierung?
- **Sensitive Data Exposure:** Werden Passwort-Hashes, Session-Tokens oder interne IDs jemals in API-Responses geleaked?

---

### 6. Prisma & Datenbank

- **N+1 Queries:** Gibt es Stellen wo in einer Schleife einzelne DB-Abfragen gemacht werden statt einer Batch-Query?
- **Missing Indexes:** Gibt es häufig gefilterte Felder ohne Index? (z.B. `PilotAnswer.sessionId`, `PilotAnswer.questionId`)
- **Cascade-Deletes:** Sind `onDelete` Regeln konsistent? Was passiert wenn man eine PilotSession löscht — werden die PilotAnswers mitgelöscht?
- **Typ-Mismatches:** Werden Strings wo Zahlen erwartet werden korrekt konvertiert? (Antwort-Werte sind Strings "1"/"3"/"5" in der DB aber Zahlen in der Statistik)

---

### 7. Build & TypeScript

- Kompiliert das Projekt fehlerfrei? (`npm run build`)
- Gibt es `any`-Types die Fehler verstecken?
- Gibt es unused Imports oder Dead Code?
- Sind die TypeScript-Types konsistent zwischen API-Response und Client-Consumption?

---

## Output-Format

Gruppiere deine Findings nach Severity:

**🔴 Critical** — Datenverlust, Security-Lücke, oder komplett kaputter Flow
**🟠 High** — Falsche Daten, schlechte UX bei normalem Gebrauch
**🟡 Medium** — Edge Cases die ab und zu auftreten, fehlende Validierung
**⚪ Low** — Code-Qualität, Performance, Cleanup

Für jeden Fund:
```
[Severity] Datei:Zeile — Kurzbeschreibung
Was passiert: ...
Warum es ein Problem ist: ...
Fix: ...
```

Am Ende: Eine priorisierte Liste der Top 5 Dinge die sofort gefixt werden müssen.
