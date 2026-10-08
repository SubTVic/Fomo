// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";
import { getGroups, getMatchableGroups, getQuizFilters, getQuizItems } from "@/lib/data";
import { MIN_ACTIVE_ANSWERS } from "@/lib/matching";

type Lang = "de" | "en";

const REPO_URL = "https://github.com/SubTVic/Fomo";
const MATCHING_SOURCE_URL = `${REPO_URL}/blob/main/static-site/src/lib/matching.ts`;

// Worked example: six non-neutral answers of a user vs. one group.
// Values: 1 = agree, 0 = neutral, -1 = disagree.
export const EXAMPLE = [
  { you: 1, group: 1 },
  { you: 1, group: 0 },
  { you: -1, group: -1 },
  { you: 1, group: -1 },
  { you: -1, group: -1 },
  { you: 1, group: 1 },
];
const EXAMPLE_TOTAL = EXAMPLE.reduce((s, r) => s + Math.abs(r.you - r.group), 0);
const EXAMPLE_MAX = EXAMPLE.length * 2;
export const EXAMPLE_SCORE = Math.round((1 - EXAMPLE_TOTAL / EXAMPLE_MAX) * 100);

/**
 * "So funktioniert's" — plain-language explanation of the matching, kept in
 * sync with src/lib/matching.ts (numbers come from the data, the example is
 * computed with the same formula).
 */
export function TransparencyContent({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const prefix = en ? "/en" : "";
  const itemCount = getQuizItems().length;
  const filterCount = getQuizFilters().options.length;
  const verifiedCount = getMatchableGroups().length;
  const groupCount = getGroups().length;
  const answerLabel = (v: number) =>
    v > 0 ? (en ? "agree" : "stimme zu") : v < 0 ? (en ? "disagree" : "stimme nicht zu") : "neutral";

  const strong = "text-navy";
  const link = "font-semibold text-navy underline underline-offset-4 hover:text-accent-muted";

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6">
      <p className="font-heading text-sm text-accent-muted">{en ? "TRANSPARENCY" : "TRANSPARENZ"}</p>
      <h1 className="mt-2 hyphens-auto break-words text-3xl text-navy sm:text-4xl">
        {en ? "How FOMO finds your matches" : "So entstehen deine Matches"}
      </h1>

      <div className="mt-8 space-y-8 text-body">
        <section className="border-poster bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg text-navy">{en ? "In short" : "Kurz gesagt"}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {en ? (
              <>
                <li>
                  You and the groups answer the <strong className={strong}>same {itemCount} statements</strong>. FOMO
                  shows the groups whose answers are <strong className={strong}>closest to yours</strong>.
                </li>
                <li>
                  It is a simple, open formula — <strong className={strong}>no AI</strong>, no hidden weights, no paid
                  placements.
                </li>
                <li>
                  The calculation runs <strong className={strong}>entirely in your browser</strong>.
                </li>
              </>
            ) : (
              <>
                <li>
                  Du und die Gruppen beantworten <strong className={strong}>dieselben {itemCount} Aussagen</strong>.
                  FOMO zeigt dir die Gruppen, deren Antworten <strong className={strong}>deinen am nächsten</strong>{" "}
                  sind.
                </li>
                <li>
                  Dahinter steckt eine einfache, offene Formel – <strong className={strong}>keine KI</strong>, keine
                  versteckten Gewichte, keine gekauften Plätze.
                </li>
                <li>
                  Die Rechnung läuft <strong className={strong}>komplett in deinem Browser</strong>.
                </li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">
            {en ? "1. Where the group data comes from" : "1. Woher die Daten der Gruppen kommen"}
          </h2>
          <p className="mt-2">
            {en
              ? `Each group answers the ${itemCount} statements itself, from the point of view of a typical member, and picks which of the ${filterCount} activities it offers. Only groups that confirmed their profile this way take part in the quiz — currently ${verifiedCount} of ${groupCount}.`
              : `Jede Gruppe beantwortet die ${itemCount} Aussagen selbst – aus Sicht eines typischen Mitglieds – und wählt, welche der ${filterCount} Aktivitäten sie anbietet. Im Quiz sind nur Gruppen, die ihr Profil so bestätigt haben – aktuell ${verifiedCount} von ${groupCount}.`}
          </p>
          <p className="mt-2">
            {en ? (
              <>
                The other groups are listed in the{" "}
                <Link href={`${prefix}/groups`} className={link}>
                  directory
                </Link>{" "}
                with a note. Their profiles were compiled from public sources and are not used for the ranking.
              </>
            ) : (
              <>
                Die übrigen Gruppen stehen mit Hinweis im{" "}
                <Link href={`${prefix}/groups`} className={link}>
                  Verzeichnis
                </Link>
                . Ihre Profile wurden aus öffentlichen Quellen zusammengetragen und fließen nicht ins Ranking ein.
              </>
            )}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">{en ? "2. Activities as a filter" : "2. Aktivitäten als Filter"}</h2>
          <p className="mt-2">
            {en
              ? "If you pick activities (e.g. music or sports), groups that offer none of them are left out. Groups that have not stated any activities stay in. If you pick nothing, nothing is filtered."
              : "Wählst du Aktivitäten aus (z. B. Musik oder Sport), fallen Gruppen heraus, die keine davon anbieten. Gruppen ohne Angaben zu Aktivitäten bleiben drin. Wählst du nichts, wird nichts gefiltert."}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">{en ? "3. The comparison" : "3. Der Vergleich"}</h2>
          <p className="mt-2">
            {en
              ? "Only statements you agreed or disagreed with count — neutral answers are skipped. For each of them FOMO checks how far apart you and the group are:"
              : "Es zählen nur die Aussagen, bei denen du zugestimmt oder abgelehnt hast – neutrale Antworten werden übersprungen. Für jede davon schaut FOMO, wie weit du und die Gruppe auseinanderliegen:"}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{en ? "same answer: distance 0" : "gleiche Antwort: Abstand 0"}</li>
            <li>{en ? "the group answered neutral: distance 1" : "die Gruppe hat neutral geantwortet: Abstand 1"}</li>
            <li>{en ? "opposite answers: distance 2" : "gegensätzliche Antworten: Abstand 2"}</li>
          </ul>
          <p className="mt-3">
            {en
              ? "The match is 100 % minus the share of the largest possible distance:"
              : "Das Match ist 100 % minus dem Anteil am größtmöglichen Abstand:"}
          </p>
          <p className="mt-2 border-l-4 border-navy bg-card px-4 py-3 font-heading text-sm text-navy">
            {en
              ? "Match = 100 % × (1 − sum of distances ÷ (2 × number of your non-neutral answers))"
              : "Match = 100 % × (1 − Summe der Abstände ÷ (2 × Anzahl deiner nicht-neutralen Antworten))"}
          </p>

          <h3 className="mt-5 font-heading text-base text-navy">{en ? "Example" : "Beispiel"}</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse bg-card text-sm">
              <thead>
                <tr className="border-b-2 border-navy text-left text-navy">
                  <th className="px-3 py-2">{en ? "Statement" : "Aussage"}</th>
                  <th className="px-3 py-2">{en ? "You" : "Du"}</th>
                  <th className="px-3 py-2">{en ? "Group" : "Gruppe"}</th>
                  <th className="px-3 py-2 text-right">{en ? "Distance" : "Abstand"}</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE.map((row, i) => (
                  <tr key={i} className="border-b border-navy/15">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{answerLabel(row.you)}</td>
                    <td className="px-3 py-2">{answerLabel(row.group)}</td>
                    <td className="px-3 py-2 text-right">{Math.abs(row.you - row.group)}</td>
                  </tr>
                ))}
                <tr className="font-semibold text-navy">
                  <td className="px-3 py-2" colSpan={3}>
                    {en ? "Sum" : "Summe"}
                  </td>
                  <td className="px-3 py-2 text-right">{EXAMPLE_TOTAL}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            {en
              ? `Largest possible distance: 2 × ${EXAMPLE.length} = ${EXAMPLE_MAX}. Match: 100 % × (1 − ${EXAMPLE_TOTAL} ÷ ${EXAMPLE_MAX}) = ${EXAMPLE_SCORE} %.`
              : `Größtmöglicher Abstand: 2 × ${EXAMPLE.length} = ${EXAMPLE_MAX}. Match: 100 % × (1 − ${EXAMPLE_TOTAL} ÷ ${EXAMPLE_MAX}) = ${EXAMPLE_SCORE} %.`}
          </p>
          <p className="mt-2">
            {en
              ? `With fewer than ${MIN_ACTIVE_ANSWERS} non-neutral answers FOMO shows no ranking: with so little information almost every group would fit equally well.`
              : `Bei weniger als ${MIN_ACTIVE_ANSWERS} nicht-neutralen Antworten zeigt FOMO kein Ranking – mit so wenig Information würde fast jede Gruppe gleich gut passen.`}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">{en ? "4. Order and ties" : "4. Reihenfolge und Gleichstände"}</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {en ? (
              <>
                <li>Groups are sorted by their exact match, before rounding.</li>
                <li>
                  If two groups are exactly tied, a group that shares one of your chosen activities comes first.
                </li>
                <li>
                  Remaining ties are broken by a fixed calculation from your answers: the same answers always give the
                  same order (a shared link looks the same for everyone), but different people see tied groups in
                  different orders — so no group is always first just because of its name.
                </li>
                <li>
                  You first see the top 5. Groups tied with number 5 are shown too, up to 10. You can show more at any
                  time.
                </li>
              </>
            ) : (
              <>
                <li>Sortiert wird nach dem genauen Match, vor dem Runden.</li>
                <li>
                  Liegen zwei Gruppen exakt gleichauf, kommt eine Gruppe zuerst, die eine deiner gewählten Aktivitäten
                  anbietet.
                </li>
                <li>
                  Restliche Gleichstände entscheidet eine feste Rechnung aus deinen Antworten: Gleiche Antworten ergeben
                  immer dieselbe Reihenfolge (ein geteilter Link sieht für alle gleich aus), aber verschiedene Leute
                  sehen gleichauf liegende Gruppen in unterschiedlicher Reihenfolge – so steht keine Gruppe nur wegen
                  ihres Namens immer vorn.
                </li>
                <li>
                  Zuerst siehst du die Top 5. Gruppen, die mit Platz 5 gleichauf liegen, werden mit angezeigt, bis
                  höchstens 10. Weitere kannst du jederzeit einblenden.
                </li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">{en ? "5. What FOMO cannot do" : "5. Was FOMO nicht kann"}</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {en ? (
              <>
                <li>The group profiles are self-assessments. A group may see itself differently than you would.</li>
                <li>
                  Only the {itemCount} statements and the activities count — not the descriptions, size or popularity
                  of a group.
                </li>
                <li>A match is a suggestion, not a verdict. Best way to find out: visit a group&apos;s meeting.</li>
              </>
            ) : (
              <>
                <li>Die Profile der Gruppen sind Selbsteinschätzungen. Eine Gruppe sieht sich vielleicht anders, als du sie erleben würdest.</li>
                <li>
                  Es zählen nur die {itemCount} Aussagen und die Aktivitäten – nicht Beschreibung, Größe oder
                  Beliebtheit einer Gruppe.
                </li>
                <li>Ein Match ist ein Vorschlag, kein Urteil. Am besten findest du es heraus, indem du vorbeischaust.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg text-navy">{en ? "6. Your data" : "6. Deine Daten"}</h2>
          <p className="mt-2">
            {en ? (
              <>
                Your answers are matched in your browser and are not linked to you. If anonymous statistics are on, the
                answers are additionally counted without any identifier to improve FOMO. Details:{" "}
                <Link href="/datenschutz" className={link}>
                  privacy policy (German)
                </Link>
                .
              </>
            ) : (
              <>
                Deine Antworten werden in deinem Browser verglichen und keiner Person zugeordnet. Ist die anonyme
                Statistik aktiv, werden die Antworten zusätzlich ohne Identifikationsmerkmal gezählt, um FOMO zu
                verbessern. Details in der{" "}
                <Link href="/datenschutz" className={link}>
                  Datenschutzerklärung
                </Link>
                .
              </>
            )}
          </p>
        </section>

        <section className="border-poster bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg text-navy">{en ? "Check it yourself" : "Selbst nachprüfen"}</h2>
          <p className="mt-2">
            {en ? (
              <>
                FOMO is open source (AGPL-3.0). The complete calculation is in{" "}
                <a href={MATCHING_SOURCE_URL} className={link} target="_blank" rel="noopener noreferrer">
                  matching.ts
                </a>
                ; the full code is on{" "}
                <a href={REPO_URL} className={link} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                . Questions or doubts? Write to{" "}
                <a href="mailto:fomo@yeti-dresden.org" className={link}>
                  fomo@yeti-dresden.org
                </a>
                .
              </>
            ) : (
              <>
                FOMO ist Open Source (AGPL-3.0). Die komplette Rechnung steht in{" "}
                <a href={MATCHING_SOURCE_URL} className={link} target="_blank" rel="noopener noreferrer">
                  matching.ts
                </a>
                , der ganze Code auf{" "}
                <a href={REPO_URL} className={link} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                . Fragen oder Zweifel? Schreib uns an{" "}
                <a href="mailto:fomo@yeti-dresden.org" className={link}>
                  fomo@yeti-dresden.org
                </a>
                .
              </>
            )}
          </p>
          <Link
            href={`${prefix}/quiz`}
            className="mt-5 inline-flex border-4 border-navy bg-navy px-6 py-3 font-heading text-sky transition-colors hover:bg-navy-hover"
          >
            {en ? "Take the test" : "Mach den Test"}
          </Link>
        </section>
      </div>
    </div>
  );
}
