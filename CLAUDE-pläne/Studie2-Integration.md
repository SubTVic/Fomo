# Studie 2 — Website-Integration

**Stand:** 2026-05-07
**Item-Pool:** [`data/working-set-v2.json`](../data/working-set-v2.json)
**Studien-Plan:** [`data/study2-plan.md`](../data/study2-plan.md)
**Ziel:** Studie 2 (Mitglieder-Validierung) live auf `/pilot`, Prototyp-Link auf Homepage, `APP_MODE` simplifizieren.

Dieser Plan ist autoritativ — alle Entscheidungen sind getroffen, du musst nichts zurückfragen. Bei echten Mehrdeutigkeiten: zugunsten der einfachsten Variante entscheiden und im Commit notieren.

## Locked Decisions

1. **Studie-2-Mitglieder-Quiz läuft unter `/pilot`.** Pilot 1 ist abgeschlossen, alte Daten bleiben in `pilot_sessions` und im Admin sichtbar. Die `(public)/pilot`- und `(fullscreen)/pilot/survey`-Verzeichnisse sind aktuell leer — du legst dort neu an.
2. **Prototyp-Link auf Homepage zeigt auf `/quiz`** (existiert bereits) mit Disclaimer-Banner.
3. **`APP_MODE` (3 Werte) → `APP_LIVE` (Bool).** Default `false`. `pilot`/`collect`/`live` werden ersetzt.
4. **Skala: 3 Stufen** (`-1` / `0` / `+1` intern; UI-Label „Stimme nicht zu" / „Neutral" / „Stimme zu"). Keine 5er-Likert.
5. **Neue DB-Tabelle `Study2Session` + `Study2Answer`** parallel zu den Pilot-1-Tabellen. Nicht in `PilotSession` mischen.
6. **Filter wird als 1 Quiz-Schritt vor den Likert-Items angezeigt** (Multi-Select, optional, `Skip`-fähig).
7. **`groupId` ist Pflicht** im Studie-2-Submit (Mitglied-zu-Gruppe-Zuordnung) — sonst keine Validierungs-Auswertung möglich. Falls die User-Gruppe nicht in `Group` existiert: Free-Text-Fallback in `groupNameFreeText`.

## 1 — Datenbank

### 1.1 Schema-Erweiterung

In `prisma/schema.prisma` **nach** dem `PilotAnswer`-Model anhängen:

```prisma
// ─── Studie 2 (Mitglieder-Validierung) ───────────────────────────

model Study2Session {
  id                  String    @id @default(cuid())
  startedAt           DateTime  @default(now())
  completedAt         DateTime?

  // Pflicht: Mitglied einer Gruppe
  groupId             String?   // FK auf Group, null wenn nur Freitext
  groupNameFreeText   String?   // Fallback wenn Gruppe nicht in DB

  // Filter-Antwort (Multi-Select, JSON-Array von attribute-IDs)
  filterSelections    Json?     // z.B. ["handsOn","music"]

  // Demografie
  semester            String?   // "1","2","3","4","5","6+"
  studyField          String?   // freier Studiengang-Text
  isMember            String?   @default("yes") // immer "yes" hier, aber konsistent mit Pilot 1

  // Optionales Freitext-Feedback (wie Pilot 1)
  feedbackConfusing   String?   @db.Text
  feedbackMissing     String?   @db.Text

  group   Group?           @relation(fields: [groupId], references: [id], onDelete: SetNull)
  answers Study2Answer[]

  @@index([groupId])
  @@index([completedAt])
  @@map("study2_sessions")
}

model Study2Answer {
  id         String  @id @default(cuid())
  sessionId  String
  itemId     String  // z.B. "WS2-01"
  value      Int     // -1 | 0 | 1

  session Study2Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, itemId])
  @@index([sessionId])
  @@map("study2_answers")
}
```

`Group` braucht zusätzlich:

```prisma
study2Sessions Study2Session[]
```

(Im Group-Block bei den anderen Relationen einfügen.)

### 1.2 Migration

```bash
npx prisma migrate dev --name add_study2_models
```

Migration-Name: `add_study2_models`. Keine Daten-Migration nötig (greenfield).

## 2 — Item-Pool als TypeScript-Modul

Datei: `src/lib/study2/items.ts`

```ts
// SPDX-License-Identifier: AGPL-3.0-only
import workingSet from "../../../data/working-set-v2.json";

export type Study2Item = {
  id: string;
  pilotQuestionId: string | null;
  text: string;
  shortTitle: string;
  construct: string;
  attributes: Array<{
    attribute: string;
    isInverse: boolean;
    valueMap?: Record<string, number>;
  }>;
};

export type Study2Filter = {
  question: string;
  subtitle: string;
  options: Array<{ id: string; label: string; attribute: string; groupCount: number }>;
};

export const STUDY2_ITEMS: Study2Item[] = workingSet.items as Study2Item[];
export const STUDY2_FILTER: Study2Filter = workingSet.filters;

export type Study2AnswerValue = -1 | 0 | 1;
```

Nachher `tsconfig.json` prüfen — falls `resolveJsonModule` nicht aktiv: aktivieren.

## 3 — API-Routen

### 3.1 `POST /api/study2/submit`

Datei: `src/app/api/study2/submit/route.ts`

Verhalten:

- Validiert Body mit Zod
- Erstellt `Study2Session` + alle `Study2Answer`-Datensätze in einer Transaktion
- Setzt `completedAt = now()`
- Rate-Limit via existierender `src/lib/rate-limit.ts` (analog zu Pilot-1-Submit, falls noch da — ansonsten: max 5 Submits pro IP pro Stunde)

Body-Schema:

```ts
import { z } from "zod";

const submitSchema = z.object({
  groupId: z.string().min(1).nullable(),
  groupNameFreeText: z.string().max(200).nullable(),
  filterSelections: z.array(z.string()).max(8),
  semester: z.enum(["1","2","3","4","5","6+"]).nullable(),
  studyField: z.string().max(100).nullable(),
  feedbackConfusing: z.string().max(2000).nullable(),
  feedbackMissing: z.string().max(2000).nullable(),
  answers: z.array(z.object({
    itemId: z.string().regex(/^WS2-\d{2}$/),
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  })).min(1).max(25),
});
```

Mindestens eine von `groupId` / `groupNameFreeText` muss gesetzt sein — sonst 400.

Response: `{ sessionId: string }`.

### 3.2 `GET /api/study2/groups`

Datei: `src/app/api/study2/groups/route.ts`

Liefert vereinfachte Gruppenliste für das Auswahl-Dropdown:

```ts
const groups = await db.group.findMany({
  where: { isActive: true },
  select: { id: true, name: true },
  orderBy: { name: "asc" },
});
return NextResponse.json({ groups });
```

Kein Auth nötig (öffentlich verlinkt).

### 3.3 Admin-Export

Datei: `src/app/api/admin/study2/export/route.ts`

Analog zu `src/app/api/pilot/admin-export/route.ts` — Auth-geschützt, JSON+CSV. Body-Felder: `Study2Session` flach + answers expandiert in CSV. Nicht testen, aber der Code muss `db.study2Session.findMany({ include: { answers: true, group: { select: { id: true, name: true } } } })` benutzen.

## 4 — Routen & UI

### 4.1 `(public)/pilot/page.tsx` — Intro-Screen

**Pfad:** `src/app/(public)/pilot/page.tsx`

**Verhalten:** Server Component, statisch. Erklärt Studie 2 in 6 Blöcken:

1. **Wer wird gesucht** — „Du bist Mitglied einer Hochschulgruppe an der TU Dresden? Dann brauchen wir dich."
2. **Warum** — „Wir wollen prüfen, ob unser Quiz dich tatsächlich zu deiner Gruppe matchen würde. Dafür beantwortest du 20 Fragen wie ein Erstsemester, der gerade nach einer Gruppe sucht. So können wir messen, welche Fragen funktionieren und welche raus müssen."
3. **Was passiert mit den Daten** — „Komplett anonym. Kein Account. Keine personenbezogenen Daten. Wir speichern nur deine Antworten und welche Gruppe du angegeben hast."
4. **Dauer** — „~5 Minuten."
5. **Was du bekommst** — „Am Ende zeigen wir dir, welche der ~80 Hochschulgruppen am besten zu deinen Antworten passen — und ob deine eigene Gruppe darunter ist."
6. **CTA** — Button „Studie starten" → `/pilot/quiz`

Stilistisch konsistent mit `(public)/page.tsx`: Brutalist-Poster, Border 4px, Header mit dunklem Background, Texte in den definierten Farben (siehe CLAUDE.md Farbschema).

**Layout-Skelett:**

```tsx
// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";

export default function Study2IntroPage() {
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[800px] border-4 border-foreground bg-card">
        {/* Header */}
        <div className="bg-foreground text-primary-foreground px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-primary-foreground/45 mb-2">Studie für Mitglieder</p>
          <h1 className="font-heading text-[clamp(26px,5vw,44px)] uppercase leading-none">Hilf uns, FOMO besser zu machen</h1>
        </div>

        {/* Sections */}
        <Section title="Wer wird gesucht">…</Section>
        <Section title="Warum wir dich brauchen">…</Section>
        <Section title="Was passiert mit den Daten">…</Section>
        <Section title="Dauer">~5 Minuten.</Section>
        <Section title="Was du bekommst">…</Section>

        {/* CTA */}
        <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 flex flex-col items-center gap-2">
          <Link href="/pilot/quiz" className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors">
            Studie starten
          </Link>
          <span className="text-[11px] text-muted-foreground">Anonym · Im Browser · ~5 Min</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-4 border-foreground px-6 py-6 sm:px-8">
      <h2 className="font-heading text-lg uppercase mb-3">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
```

Texte aus 1.–5. einsetzen (nicht aus `SiteConfig`-CMS — statisch hardgecodet ist hier okay).

### 4.2 `(fullscreen)/pilot/quiz/page.tsx` — Quiz-Flow

**Pfad:** `src/app/(fullscreen)/pilot/quiz/page.tsx`

Client Component. Schritte (in Reihenfolge, einer pro Screen):

1. **Gruppe wählen** — Searchable-Select (Combobox aus shadcn/ui falls verfügbar, sonst nativer `<select>` mit Such-Input). Lädt Gruppenliste über `/api/study2/groups`. Zusätzlich Free-Text-Feld „Gruppe nicht dabei? Tippe ihren Namen". Ein Wert ist Pflicht.
2. **Filter** — Multi-Select mit den 8 Optionen aus `STUDY2_FILTER`, Subtitle „Mehrfachauswahl. Lass leer, wenn dir alles offen ist." `Weiter` ist immer aktiv (auch ohne Auswahl).
3. **Likert (20 Items, ein Item pro Screen)** — drei große Buttons (Stimme nicht zu / Neutral / Stimme zu). Direkter Weiterskip nach Klick. Progress-Bar oben (`Frage X von 20`). Zurück-Button.
4. **Demografie** — Semester (Dropdown 1/2/3/4/5/6+), Studienfach (optional Freitext).
5. **Feedback (optional)** — Zwei Textfelder (Confusing / Missing), beide skipbar.
6. **Submit + Ergebnis** — POST an `/api/study2/submit`, danach Anzeige: „Danke! Deine Antworten sind gespeichert." + Hinweis, wann Ergebnisse kommen. **Optional Phase 4:** Live-Match-Vorschau (zunächst weglassen).

Komponenten möglichst wiederverwenden falls in `src/components/quiz/` oder `src/lib/quiz/` etwas existiert (z.B. Likert-Button-Komponente). Vor Implementierung kurz prüfen mit `ls src/components/quiz`.

State: lokal in der Client-Component via `useState`. Kein localStorage/sessionStorage (siehe CLAUDE.md). Tab-Refresh = neuer Anlauf, ist okay.

3-Stufen-Skala intern als `-1 | 0 | 1`, im Submit-Body genau diese Werte.

### 4.3 Disclaimer-Banner auf `/quiz`

**Pfad:** `src/app/(fullscreen)/quiz/page.tsx`

Oben sticky einfügen — vor allem anderen JSX:

```tsx
<div className="sticky top-0 z-50 bg-yellow-50 border-b-2 border-foreground px-4 py-2 text-xs text-foreground text-center">
  ⚠️ <strong>Prototyp</strong> — Fragen, Layout und Matching sind noch in Arbeit. Feedback gern an{" "}
  <a href="mailto:fomo@stura.tu-dresden.de" className="underline">fomo@stura.tu-dresden.de</a>
</div>
```

Mail-Adresse ggf. an `SiteConfig` (`feedback_email`) auslagern, falls dort vorhanden — nicht zwingend.

### 4.4 Homepage-CTAs umbauen

**Pfad:** `src/app/(public)/page.tsx`

**`APP_MODE` ersetzen:**

```diff
- const APP_MODE = (process.env.APP_MODE ?? "pilot") as "pilot" | "collect" | "live";
+ const APP_LIVE = process.env.APP_LIVE === "true";
```

**Render-Zweige:**

```diff
- {APP_MODE === "pilot" && <PilotCta cfg={cfg} />}
- {APP_MODE === "collect" && <CollectCta cfg={cfg} groupCount={groupCount} />}
- {APP_MODE === "live" && <LiveCta groupCount={groupCount} />}
+ {APP_LIVE ? <LiveCta groupCount={groupCount} /> : <PrelaunchCta cfg={cfg} groupCount={groupCount} />}
```

**`PrelaunchCta`-Komponente** (ersetzt `PilotCta` und `CollectCta`):

Drei Blöcke untereinander, alle innerhalb desselben Border-Containers, jeweils durch `border-t-4 border-foreground` getrennt:

1. **Studie-2-CTA** (primär, solid Button): Headline „Studie für Mitglieder", Text „Du bist in einer Hochschulgruppe? Hilf uns, FOMO zu kalibrieren — ~5 Minuten.", Button → `/pilot`
2. **Prototyp-CTA** (sekundär, outline Button, `bg-accent` Hintergrund): Headline „Prototyp ansehen", Text „So sieht das fertige Quiz schon aus. Achtung: Fragen, Layout und Matching sind noch Work-in-Progress.", Button → `/quiz`
3. **Gruppen-Registrierung** (sekundär, outline, gleicher Stil wie aktueller `CollectCta`-Block 2): Bestehender Code aus `CollectCta` für „Registriert eure Gruppe" 1:1 übernehmen, Button → `/groups/register`, „{groupCount} Gruppen sind schon dabei. …".

`PilotCta` und `CollectCta` Funktionen löschen (nicht behalten als Dead Code).

`LiveCta` bleibt unverändert.

**`SiteConfig`-Felder, die nicht mehr referenziert werden** (`pilot_label`, `pilot_title`, `pilot_text`, `pilot_button`, `pilot_duration`): bleiben in der DB, kein Migration-Schritt nötig. Im `PrelaunchCta` werden Texte hardgecodet — konsistent mit dem Intro-Screen-Stil.

## 5 — APP_LIVE umstellen — wo überall greifen

Nach Refactor folgende Stellen prüfen (mit `grep -rn 'APP_MODE' src/`):

- `src/app/(public)/page.tsx` — Hauptort, oben behandelt
- Sonstige Vorkommen: alle ersetzen mit `APP_LIVE`-Logik. Wenn der Code-Pfad nur „live" vs „nicht-live" braucht: `APP_LIVE` Bool. Wenn er Pilot-1-spezifisch war: kann gelöscht werden, da Pilot 1 inaktiv ist.
- `.env.example` aktualisieren (falls existiert): `APP_MODE=pilot` → `APP_LIVE=false`.
- `README.md` Phase-Kapitel: kurze Erwähnung, dass `APP_LIVE=true` für Launch gesetzt wird.

## 6 — Admin-Integration (Minimal)

**Pfad:** `src/app/admin/(protected)/study2/page.tsx`

Read-only Übersicht (analog zu `(protected)/pilot/page.tsx`, aber simpler):

- Anzahl Sessions (`db.study2Session.count()`)
- Anzahl mit Gruppe (`{ groupId: { not: null } }`)
- Tabelle: letzte 50 Sessions (Datum, Gruppe, Anzahl Antworten, Filter-Auswahl)
- Export-Button → `/api/admin/study2/export?format=csv|json`

Keine Lösch- oder Edit-Funktionen. Sidebar-Link in der Admin-Nav ergänzen, falls eine zentrale Nav existiert (siehe `src/app/admin/(protected)/layout.tsx`).

## 7 — Ergebnis-Reihenfolge & Reihenfolge der Items

`STUDY2_ITEMS` werden in der Reihenfolge ihrer JSON-Definition angezeigt. **Nicht** randomisieren — Drop-Off-Analyse pro Position braucht stabile Reihenfolge (siehe Studie-2-Plan M5).

## 8 — Akzeptanzkriterien

Du bist fertig, wenn alle folgenden Punkte stimmen:

1. ✅ `npx prisma migrate dev --name add_study2_models` läuft sauber durch.
2. ✅ `npm run build` ohne TypeScript-Fehler.
3. ✅ Manuell: `/pilot` zeigt Intro-Screen, „Studie starten" navigiert zu `/pilot/quiz`.
4. ✅ Manuell: `/pilot/quiz` durchläuft alle Schritte (Gruppe → Filter → 20 Items → Demografie → Feedback → Submit). Submit-Response 200, eine `Study2Session` mit 20 `Study2Answer`-Datensätzen liegt in der DB.
5. ✅ Manuell: `/quiz` zeigt Disclaimer-Banner oben.
6. ✅ Manuell: Homepage zeigt 3 CTAs untereinander (Studie 2 / Prototyp / Gruppen) bei `APP_LIVE` ungesetzt oder `false`. Bei `APP_LIVE=true` zeigt sie nur den Live-Quiz-CTA.
7. ✅ Manuell: `/admin/study2` (nach Login) zeigt Session-Übersicht und CSV-Export funktioniert.
8. ✅ `grep -rn 'APP_MODE' src/` liefert keine Treffer mehr.
9. ✅ Mobile (375px Width): alle neuen Screens passen ohne Horizontal-Scroll.

## 9 — Out of Scope (NICHT machen)

- Phase-2-Gruppen-Selbst-Rating (separates Token-basiertes Flow unter `/groups/...` — eigener Plan)
- Live-Match-Vorschau am Ende von Studie 2 (Phase 3)
- Re-Scrape oder Schema-Änderungen an `Group`-Attributen (Plan ist „nicht neu scrapen")
- Pilot-1-Daten löschen oder migrieren — bleiben unverändert
- Auswertungs-Skripte für Studie 2 (kommen erst nach Datensammlung)
- Übersetzungen / i18n
- Hochschulgruppen-Liste vervollständigen (z.B. Refugee Law Clinic) — manuell durch Admin später

## 10 — Reihenfolge der Commits

Empfohlene atomare Commits in dieser Reihenfolge:

1. `feat(db): add Study2Session and Study2Answer models`
2. `feat(study2): add item pool module and types`
3. `feat(study2): add /api/study2/groups and /api/study2/submit endpoints`
4. `feat(study2): add /pilot intro page and /pilot/quiz flow`
5. `feat(quiz): add prototype disclaimer banner`
6. `refactor(landing): replace APP_MODE with APP_LIVE and consolidate prelaunch CTAs`
7. `feat(admin): add /admin/study2 read-only view and CSV export`

Co-author Tag: `Co-Authored-By: Claude Sonnet <noreply@anthropic.com>`.
