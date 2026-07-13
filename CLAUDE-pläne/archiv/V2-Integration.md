# V2-Integration — Gruppen-Self-Rating + Prototype-Update

**Stand:** 2026-05-07
**Item-Pool:** [`data/working-set-v2.json`](../data/working-set-v2.json)
**Abhängigkeit:** `CLAUDE-pläne/archiv/Studie2-Integration.md` muss bereits umgesetzt sein (Study2Session/Study2Answer existieren in DB).

Dieser Plan ist autoritativ — keine Rückfragen nötig. Bei Mehrdeutigkeiten: einfachste Variante, Notiz im Commit.

## Kontext & Ziel

**Problem:** Phase-2-Gruppenverifikation verwendet noch eine alte 18-Checkbox-Checkliste (`AttributeChecklist.tsx`). Der Prototyp unter `/quiz` matcht gegen alte Boolean-Attribute. Beides basiert auf `working-set-v1.json`.

**Ziel:** Gruppen beantworten in Phase 2 dieselben 21 WS2-Likert-Items + Filter wie Studierenden-Nutzer in Studie 2 — nur aus Gruppen-Perspektive. Diese Antworten werden direkt als Matching-Profil für `/quiz` benutzt. Eine Datenquelle, kein Doppelaufwand.

**Nach diesem Plan:**
- Phase-2-Flow: WS2-Items aus Gruppenperspektive, inkl. `raterCount`-Feld
- `/quiz` Prototype: matched gegen WS2-Vektoren falls GroupSelfRating existiert, fallback auf alte Attribute sonst
- Homepage: Browse-CTA als vierter Block

## Locked Decisions

1. **`GroupSelfRating` ist @unique per groupId** — Gruppe kann erneut submiten (overwrite), kein neuer Datensatz.
2. **WS2-Items in Phase 2 aus Gruppen-Sicht** — Preamble: „Mitglieder unserer Gruppe würden dieser Aussage zustimmen:" — gleicher Text wie beim User, aber anderer Frame.
3. **Skala identisch: -1 / 0 / 1** (Stimme nicht zu / Neutral / Stimme zu) — selbe UI-Buttons wie `/pilot/quiz`.
4. **Matching v2 nutzt Mean-Absolute-Distance** auf WS2-Vektoren wenn GroupSelfRating vorhanden, sonst Fallback auf alten Attribut-Algorithmus in `matching.ts`. Keine Migration der alten Daten nötig.
5. **`raterCount`** als Int: 1 = „Ich allein", 2 = „Zu zweit", 3 = „3+ Personen". Dropdown am Ende des Flows (vor Submit).
6. **Alte `AttributeChecklist.tsx`** bleibt im Code, wird aber nicht mehr von der Page referenziert. Nicht löschen — `confirmedAttributes` JSON bleibt für Fallback-Matching nutzbar.
7. **Filter im Phase-2-Flow** identisch mit Study-2-Filter aus `STUDY2_FILTER` (working-set-v2.json).
8. **Homepage Browse-CTA:** vierter Block, Outline-Button, zeigt unter Gruppen-Registrierung. Text: „Lieber selbst stöbern? → Alle Gruppen anzeigen"

## 1 — Datenbank

### 1.1 Schema-Erweiterung

In `prisma/schema.prisma` nach `Study2Answer` einfügen:

```prisma
// ─── Gruppen-Selbst-Rating (Phase 2, WS2-Items) ──────────────────

model GroupSelfRating {
  id           String   @id @default(cuid())
  groupId      String   @unique    // overwrite on re-submit
  token        String              // welcher GroupInvite-Token genutzt wurde
  submittedAt  DateTime @default(now())
  raterCount   Int      @default(1) // 1 / 2 / 3+ Personen

  filterSelections Json?           // z.B. ["handsOn","music"]

  group   Group                  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  answers GroupSelfRatingAnswer[]

  @@index([groupId])
  @@map("group_self_ratings")
}

model GroupSelfRatingAnswer {
  id       String @id @default(cuid())
  ratingId String
  itemId   String  // "WS2-01" … "WS2-21"
  value    Int     // -1 | 0 | 1

  rating GroupSelfRating @relation(fields: [ratingId], references: [id], onDelete: Cascade)

  @@unique([ratingId, itemId])
  @@index([ratingId])
  @@map("group_self_rating_answers")
}
```

`Group`-Model: Relation ergänzen (bei den anderen Relationen):

```prisma
selfRating     GroupSelfRating?
```

### 1.2 Migration

```bash
npx prisma migrate dev --name add_group_self_rating
```

## 2 — Item-Modul (bereits vorhanden — nicht neu anlegen)

`src/lib/study2/items.ts` wurde durch `CLAUDE-pläne/archiv/Studie2-Integration.md` bereits erstellt und exportiert `STUDY2_ITEMS` und `STUDY2_FILTER` aus `working-set-v2.json`. **Nicht neu anlegen, nicht überschreiben.** Einfach importieren wo nötig.

## 3 — API-Routen

### 3.1 `POST /api/groups/register-attributes` — erweitern

**Datei:** `src/app/api/groups/register-attributes/route.ts`

Aktuelles Verhalten: speichert `confirmedAttributes` JSON auf `Group`.

**Neues Verhalten:** zusätzlich `GroupSelfRating` + `GroupSelfRatingAnswer` anlegen (oder updaten falls group already has rating via upsert). Altes Verhalten (`confirmedAttributes`) bleibt erhalten als Fallback-Datenschicht.

Schema-Erweiterung des Zod-Body:

```ts
const SubmitSchema = z.object({
  token: z.string().min(1),
  // legacy (optional, beibehalten für Rückwärtskompatibilität)
  confirmedAttributes: z.record(z.string(), z.union([z.literal(0), z.literal(1)])).optional(),
  shortDescription: z.string().min(10).max(200).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  // v2: WS2-Self-Rating
  ws2Answers: z.array(z.object({
    itemId: z.string().regex(/^WS2-\d{2}$/),
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  })).min(1).max(25).optional(),
  ws2FilterSelections: z.array(z.string()).max(8).optional(),
  raterCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});
```

Nach Token-Validierung zusätzlich:

```ts
if (ws2Answers && ws2Answers.length > 0) {
  await db.groupSelfRating.upsert({
    where: { groupId: group.id },
    create: {
      groupId: group.id,
      token,
      raterCount: raterCount ?? 1,
      filterSelections: ws2FilterSelections ?? [],
      answers: {
        create: ws2Answers.map(({ itemId, value }) => ({ itemId, value })),
      },
    },
    update: {
      token,
      submittedAt: new Date(),
      raterCount: raterCount ?? 1,
      filterSelections: ws2FilterSelections ?? [],
      answers: {
        deleteMany: {},
        create: ws2Answers.map(({ itemId, value }) => ({ itemId, value })),
      },
    },
  });
}
```

### 3.2 `GET /api/groups/register-attributes` — unverändert

Liefert Gruppe inkl. `scraperAttributes` / `confirmedAttributes` / `selfRating`. Ergänzen:

```ts
include: {
  selfRating: { include: { answers: true } },
}
```

Damit kann die neue UI die vorherigen Antworten vorausfüllen.

## 4 — Phase-2-UI: `GroupSelfRatingQuiz.tsx`

**Neue Datei:** `src/app/(public)/groups/register/GroupSelfRatingQuiz.tsx`

**Die alte `AttributeChecklist.tsx` bleibt unverändert** — wird aber nicht mehr von der Page verwendet.

**Page-Datei:** `src/app/(public)/groups/register/page.tsx` — ersetze `<AttributeChecklist />` durch `<GroupSelfRatingQuiz />`.

### UI-Flow (gleiche Schritt-Logik wie `/pilot/quiz`)

1. **Intro-Screen** — erklärt die Aufgabe:
   > „Bitte beantwortet die folgenden 21 Aussagen aus Sicht eurer Gruppe. Stellt euch vor, ein typisches Mitglied spricht: ‚Mitglieder unserer Gruppe würden dieser Aussage zustimmen.'"

2. **Filter** — gleiche 8 Optionen wie Study-2-Filter aus `STUDY2_FILTER`. Frage: „Welche Aktivitäten stehen bei euch im Vordergrund?" (Mehrfachauswahl, nicht Pflicht).

3. **21 Likert-Items** — ein Item pro Screen. Preamble über jedem Item:
   > „Mitglieder unserer Gruppe würden zustimmen:"
   
   Dann der Item-Text aus `STUDY2_ITEMS[n].text`. Drei Buttons: Stimme nicht zu / Neutral / Stimme zu → -1 / 0 / 1. Direkter Weiterskip nach Klick. Progress-Bar „Frage X von 21".

4. **raterCount** — letzter Schritt vor Submit. Frage: „Wie viele Personen haben die Antworten gemeinsam erarbeitet?" Drei Buttons: Ich allein (1) / Zu zweit (2) / 3 oder mehr (3).

5. **Submit** → `POST /api/groups/register-attributes` mit `ws2Answers`, `ws2FilterSelections`, `raterCount`. Erfolgs-Screen wie bisher.

**Vorausfüllen:** Falls `group.selfRating?.answers` vorhanden (Re-Submit), Antworten vorausfüllen. Falls nicht, alle Items auf 0 initialisieren.

**State:** lokal in Client-Component via `useState`. Kein localStorage (CLAUDE.md).

### Token-Handling

Gleich wie `AttributeChecklist.tsx`: Token aus `useSearchParams()`, beim Mount `GET /api/groups/register-attributes?token=...` aufrufen, Gruppen-Name im Header anzeigen.

### Vorhandene Schnittstelle weiterverwenden

`shortDescription` und `websiteUrl` als editierbare Felder am Ende vor dem raterCount-Screen beibehalten (wie in AttributeChecklist). Diese werden weiterhin an den POST geschickt und auf `Group` gespeichert.

## 5 — Quiz-Matching: V2-Algorithmus

### 5.1 `getQuizGroups()` erweitern

**Datei:** `src/lib/queries/quiz.ts`

Ergänze `selfRating` in der DB-Query:

```ts
// In getGroupsFromDb():
const groups = await db.group.findMany({
  where: { isActive: true },
  select: {
    // ... bestehende Felder ...
    selfRating: {
      include: { answers: true },
    },
  },
});
```

Returne `selfRating` als Teil von `QuizGroupData`. Type-Erweiterung in `src/lib/quiz/types.ts`:

```ts
selfRating?: {
  raterCount: number;
  filterSelections: string[];
  answers: Array<{ itemId: string; value: number }>;
} | null;
```

### 5.2 Neues Matching für V2

**Datei:** `src/lib/quiz/matching.ts` — neue Funktion ergänzen (alte `computeQuizMatches` bleibt für Fallback):

```ts
/**
 * V2 matching: cosine/distance over WS2 item vectors.
 * Used when group has a GroupSelfRating.
 * User answers: Record<itemId, -1|0|1>
 * Group answers: Array<{itemId, value}>
 */
export function computeV2Match(
  userAnswers: Record<string, number>,  // itemId → -1|0|1
  groupAnswers: Array<{ itemId: string; value: number }>,
  filterSelections: string[],  // user's filter choices
  groupFilterSelections: string[],  // group's filter choices
): number {
  // Filter hard constraint: if user selected filters AND group has none of them → score 0
  if (filterSelections.length > 0 && groupFilterSelections.length > 0) {
    const hasOverlap = filterSelections.some(f => groupFilterSelections.includes(f));
    if (!hasOverlap) return 0;
  }

  const groupMap = Object.fromEntries(groupAnswers.map(a => [a.itemId, a.value]));
  const items = Object.keys(userAnswers).filter(id => userAnswers[id] !== 0); // skip neutral

  if (items.length === 0) return 50;

  const totalDist = items.reduce((sum, id) => {
    const u = userAnswers[id];          // -1 | 1 (neutral already filtered)
    const g = groupMap[id] ?? 0;        // -1 | 0 | 1, default 0 if group didn't answer
    return sum + Math.abs(u - g);       // max distance = 2
  }, 0);

  // Normalize: 0 = perfect match (all same), 1 = perfect mismatch (all opposite)
  const maxDist = items.length * 2;
  return Math.round((1 - totalDist / maxDist) * 100);
}
```

### 5.3 `QuizRouter` / Matching-Entry-Point anpassen

Beim Aufruf von `computeQuizMatches()` in `QuizRouter` oder der Quiz-Client-Komponente: prüfen ob `group.selfRating` vorhanden. Falls ja → `computeV2Match()` verwenden. Falls nein → bestehenden `computeSingleMatch()`-Pfad (Legacy-Fallback).

Ort: `src/components/quiz/QuizRouter.tsx` (oder wo `computeQuizMatches` aufgerufen wird — kurz greppen mit `grep -rn computeQuizMatches src/`).

Neue Typen-Konversion: User-Antworten aus dem Quiz kommen als `"1"|"3"|"5"` (legacy 1/3/5 Skala) oder direkt als `-1|0|1` (v2). Für v2-Matching konvertieren: `"5"→1, "3"→0, "1"→-1`.

## 6 — Homepage: Browse-CTA

**Datei:** `src/app/(public)/page.tsx`

Vierter Block in `PrelaunchCta`, unter Gruppen-Registrierung. Gleicher Border-Trennstil:

```tsx
{/* Browse CTA */}
<div className="border-t-4 border-foreground px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <p className="text-sm text-muted-foreground">
    Lieber selbst stöbern? Schau dir alle Hochschulgruppen direkt an.
  </p>
  <Link
    href="/groups"
    className="shrink-0 border-2 border-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors text-center"
  >
    Alle Gruppen anzeigen →
  </Link>
</div>
```

Auch im `LiveCta`-Block eine kleine Textzeile unter dem Quiz-Button ergänzen:
```tsx
<Link href="/groups" className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
  Oder alle Gruppen anzeigen →
</Link>
```

## 7 — Akzeptanzkriterien

1. ✅ `npx prisma migrate dev --name add_group_self_rating` läuft durch.
2. ✅ `npm run build` ohne TypeScript-Fehler.
3. ✅ Manuell: `/groups/register?token=TEST` lädt den neuen `GroupSelfRatingQuiz` statt `AttributeChecklist`.
4. ✅ Manuell: Gesamter Flow (Intro → Filter → 21 Items → raterCount → Submit) läuft durch. DB: `group_self_ratings` hat 1 Datensatz, `group_self_rating_answers` hat 21 Datensätze.
5. ✅ Manuell: Bei Re-Submit (gleiche Gruppe) wird der bestehende `GroupSelfRating`-Datensatz überschrieben (upsert), kein Duplikat.
6. ✅ Manuell: `/quiz` — Gruppe mit vorhandenem `GroupSelfRating` erhält Score über V2-Algorithmus (überprüfbar mit `console.log` oder Debugger). Gruppe ohne `GroupSelfRating` erhält Score über Legacy-Algorithmus.
7. ✅ Manuell: Homepage zeigt 4 Blöcke: Studie 2 / Prototyp / Gruppen-Registrierung / Browse. Bei `APP_LIVE=true`: Quiz-CTA + „Alle Gruppen anzeigen →" Zeile.
8. ✅ Mobile 375px: alle neuen Screens ohne Horizontal-Scroll.
9. ✅ `grep -rn 'AttributeChecklist' src/app/\(public\)` — Datei existiert noch, wird aber nicht mehr von `page.tsx` importiert.

## 8 — Out of Scope

- Alte `confirmedAttributes` JSON-Daten migrieren oder löschen
- Admin-View für `GroupSelfRating` (kann über DB direkt abgerufen werden, reicht für Pilot)
- Ergebnis-Visualisierung im Quiz (welche Items waren Mismatch) — Phase 3
- Matching-Validierung mit neuen Daten (kommt nach Phase 2 und Studie 2)
- `leadershipOpportunities` / `beginnerFriendly` aus Schema entfernen — erst nach ≥42 verifizierten Gruppen (TODO.md §5.x)

## 9 — Commit-Reihenfolge

1. `feat(db): add GroupSelfRating and GroupSelfRatingAnswer models`
2. `feat(groups): add GroupSelfRatingQuiz component replacing AttributeChecklist`
3. `feat(api): extend register-attributes to save WS2 self-rating`
4. `feat(quiz): add V2 vector matching with GroupSelfRating fallback`
5. `feat(landing): add Browse CTA to PrelaunchCta and LiveCta`

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
