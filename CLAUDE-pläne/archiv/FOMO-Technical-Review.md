# FOMO — Full Codebase Audit

> **Projekt:** FOMO (Find Our Matching Organizations)
> **Stack:** Next.js 15 App Router · TypeScript strict · PostgreSQL 16 · Prisma 6 · Auth.js 5 · Docker
> **Umfang:** ~10.300 LOC in `src/`, 20 API-Endpunkte, 10 DB-Tabellen, 14 Seiten
> **Repo:** `github.com/SubTVic/Fomo` (Branch: `develop/production`)

---

## Anweisungen

Du bist ein Senior Software Engineer und Security Auditor. Führe ein vollständiges Audit dieser Codebase durch. Arbeite die folgenden 5 Phasen **sequenziell** ab. Nutze `ultrathink` für jede Phase. Arbeite im **Plan Mode** (read-only) — ändere keinen Code.

**Output-Format pro Finding:**
```
[CRITICAL|HIGH|MEDIUM|LOW] Datei:Zeile — Beschreibung — Kategorie — Fix-Vorschlag
```

Nur Findings mit Confidence ≥ 80% reporten. Keine Style-Nitpicks, keine Formatierungs-Hinweise.

---

## Phase 1 — Reconnaissance (Architektur-Map)

Ultrathink: Mappe die gesamte Codebase-Architektur bevor du analysierst.

Identifiziere und dokumentiere:

1. **Entry Points:** Jede Server Action (`'use server'`), jeden API Route Handler (`/api/*`), jeden `page.tsx`/`layout.tsx`
2. **Trust Boundaries:** Wo fließen Daten vom Client zum Server? Wo von Server zu Client? Wo von DB zum Browser?
3. **Auth-Kette:** Welche Routes sind durch Middleware geschützt? Welche durch Auth-Checks im Handler? Welche sind ungeschützt?
4. **Datenflüsse:** Quiz-Antworten → Matching (client-seitig), Admin-Eingaben → DB, Token-Links → Gruppen-Registrierung, Session-Tracking → Analytics
5. **Prisma-Modelle:** Alle Relationen, Cascade-Verhalten, fehlende Indizes auf häufig abgefragte Spalten

Erstelle eine **Security-relevante Architektur-Map** als Textdiagramm.

---

## Phase 2 — Security Scan (Parallel-Fokus)

Prüfe jeden der folgenden Bereiche systematisch:

### 2a) Auth & Access Control
- Verifiziert jeder API-Endpunkt unter `/api/admin/*` die Session UND die Rolle (SUPER_ADMIN vs EDITOR)?
- Gibt es IDOR-Schwachstellen? (z.B. `/api/admin/groups/[id]` — kann ein EDITOR fremde Gruppen löschen?)
- Auth.js Callbacks: Werden alle Error-Paths abgefangen? Ist die Session-Konfiguration sicher?
- Middleware (`middleware.ts`): Deckt sie ALLE Admin-Routes ab? Gibt es Bypasses über direkte API-Aufrufe?
- Token-System (`GroupInvite`): Ist das atomare Claiming (`updateMany` mit `usedAt: null`) race-condition-sicher?
- Rate-Limiting: Ist der in-memory Limiter ausreichend? (Hint: Multi-Instance = kein Shared State)

### 2b) Injection & Input-Validierung
- Hat JEDER API-Endpunkt Zod-Validierung auf dem Request Body/Query?
- Gibt es Raw-SQL oder String-Interpolation in Prisma-Queries?
- XSS: Wird User-generierter Content (Gruppen-Namen, Beschreibungen, Attribute) escaped bevor er gerendert wird?
- `QuizSession.answers` und `QuizSession.topMatches` sind JSON-Felder — wird der Input validiert bevor er in die DB geht?
- Server Actions: Wird `'use server'` korrekt verwendet? Können Closures Parent-Scope-Daten leaken?

### 2c) Data Exposure & Secrets
- Gibt es `NEXT_PUBLIC_*` Environment Variables die sensible Daten enthalten?
- Werden volle DB-Objekte (mit internen IDs, Timestamps, etc.) an Client Components durchgereicht?
- Error-Responses: Geben sie interne Details preis (Stack Traces, DB-Fehler, Prisma-Error-Messages)?
- Hardcoded Secrets, API-Keys oder Passwörter im Code?
- Docker Compose: Sind DB-Credentials sicher konfiguriert?

### 2d) Next.js 15-spezifisch
- Sind alle `[param]`-Segmente in Dynamic Routes validiert (nicht als trusted input behandelt)?
- Wird der `Next-Action` Header korrekt gehandhabt?
- ISR-Cache (1h): Kann ein veralteter Cache zu inkonsistenten Quiz-Daten führen?
- Prüfe auf CVE-2025-66478 (RCE via crafted RSC payloads) — ist die Next.js-Version ≥ 15.1.9?

---

## Phase 3 — Matching-Algorithmus Korrektheit

Ultrathink: Trace den Matching-Algorithmus end-to-end durch (`src/lib/quiz/`).

Prüfe:
1. **Mathematische Korrektheit:** Normalisierung (1.0/0.5/0.0), Gewichtung (`|normalized - 0.5| × 2`), Similarity (`1 - |effectiveUser - groupAttr|`), Aggregation (`Σ(weight × similarity) / Σ(weight)`)
2. **isInverse-Logik:** Wird `effectiveUser = isInverse ? (1 - normalized) : normalized` korrekt angewendet? (Bekannter Bug: D3Q5, D10Q4 zeigen verdächtige negative r_it-Werte — prüfe ob Inversion in der Statistik-Berechnung fehlt)
3. **Edge Cases:** Alle Antworten neutral (totalWeight = 0 → Division by Zero?), keine Antworten, < 5 nicht-neutrale Antworten, Gruppe mit allen Attributen false/true
4. **Tie-Breaker:** Mehr Match-Attribute → höher, weniger Konflikte → höher, alphabetisch (deutsch) — ist die Sortierung stabil?
5. **Score-Bereich:** Kann das Ergebnis < 0% oder > 100% werden?
6. **Triple-Speicherung:** Boolean-Spalten vs. `confirmedAttributes` vs. `scraperAttributes` — gibt es Stellen wo die Source of Truth inkonsistent ist?
7. **Unit-Tests:** Decken die 16 Tests alle oben genannten Edge Cases ab? Sind die Assertions spezifisch genug (nicht nur `toBeDefined`)?

---

## Phase 4 — Architektur & Code-Qualität

Ultrathink: Bewerte die Architektur-Fitness:

### 4a) Datenbank
- Fehlende Indizes auf häufig gefilterte/sortierte Spalten (z.B. `Group.category`, `QuizSession.semester`, `GroupInvite.token`)
- Cascade-Delete-Verhalten: Was passiert wenn eine `Category` gelöscht wird? Gehen alle `Groups` verloren?
- Enum-Nutzung: Werden Status-Werte (`eingeladen/eingereicht/verifiziert/aktiv`) als String oder Enum gespeichert?
- Fehlende Audit-Timestamps (`createdAt`/`updatedAt`) auf Tabellen

### 4b) Dead Code & Unused Exports
- Unerreichbare Funktionen, ungenutzte Imports, verwaiste Komponenten
- 4 Quiz-UI-Varianten: Gibt es geteilten Code der dupliziert statt abstrahiert ist?
- `pilot-archive/` und `docs/` — referenziert der aktive Code diese Dateien?

### 4c) Error Handling
- Ungefangene Promise-Rejections in API-Routes
- Leere `catch`-Blöcke
- Fehlende React Error Boundaries
- `navigator.sendBeacon()` im Abbruch-Tracking — was passiert wenn der Beacon fehlschlägt?

### 4d) Performance
- N+1-Queries: Prisma-Aufrufe in Schleifen, fehlende `include`/`select`
- Bundle-Size: Werden Admin-Komponenten in den Quiz-Bundle geladen?
- ISR-Revalidierung: 1h Cache bei 6.300 Erstis in einer Woche — reicht das?
- Client-seitiges Matching bei 200+ Gruppen × 20 Attribute — Performance-Messung?

### 4e) Type Safety
- `any`-Types, unsichere Type Assertions (`as`), unvalidierte externe Daten
- JSON-Felder (`confirmedAttributes`, `scraperAttributes`, `answers`, `topMatches`) — haben sie Zod-Schemas oder sind sie untypisiert?

---

## Phase 5 — Validierung & Priorisierung

Für JEDES Finding aus Phase 2–4:

1. Trace den kompletten Datenfluss vom User-Input zum Impact
2. Bestimme ob das Finding in DIESEM spezifischen Codebase-Kontext tatsächlich exploitbar ist
3. Entferne False Positives
4. Vergib Confidence Score (0–100) — nur ≥ 80 überlebt

### Output: Priorisierter Remediation-Plan

**Gruppe A — Quick Wins (< 30 Min):**
- Fehlende Input-Validierung, Auth-Checks, Environment-Variable-Leaks

**Gruppe B — Medium Fixes (< 2 Stunden):**
- Refactoring Data Access Patterns, fehlende Tests, Error Handling

**Gruppe C — Architektur-Änderungen (> 2 Stunden):**
- Schema-Migrationen, Auth-Flow-Restructuring, Bundle-Splitting

Für jeden Fix: konkretes Code-Beispiel mit vorher/nachher.

---

## Kontext: Bekannte offene Punkte

Diese Punkte sind dem Team bekannt — flagge sie nur wenn du NEUE Erkenntnisse hast:

- [ ] `isInverse`-Bug in Statistik-Berechnung (D3Q5, D10Q4 negative r_it)
- [ ] v2-Pilotdaten müssen vor v3-Import gelöscht werden
- [ ] Uni-SSO (SAML/Shibboleth) noch nicht implementiert
- [ ] Impressum & Datenschutz-Seite fehlt
- [ ] E2E-Tests fehlen komplett
- [ ] In-Memory Rate-Limiter hat kein Shared State bei Multi-Instance

---

## Nicht im Scope

- UI/UX-Bewertung (Varianten-Wahl kommt nach Pilotstudie)
- Fragen-Formulierung (psychometrische Validierung läuft separat)
- Deployment-Konfiguration des Uni-Servers (noch nicht finalisiert)
- Styling/CSS-Qualität
