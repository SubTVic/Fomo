// SPDX-License-Identifier: AGPL-3.0-only

import { getActiveQuizTheses, getQuizGroups } from "@/lib/queries/quiz";
import { QuizRouter } from "@/components/quiz/QuizRouter";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const [theses, groups] = await Promise.all([
    getActiveQuizTheses(),
    getQuizGroups(),
  ]);

  return (
    <>
      <div className="sticky top-0 z-50 bg-yellow-50 border-b-2 border-foreground px-4 py-2 text-xs text-foreground text-center">
        ⚠️ <strong>Prototyp</strong> — Fragen, Layout und Matching sind noch in Arbeit. Feedback gern an{" "}
        <a href="mailto:fomo@stura.tu-dresden.de" className="underline">
          fomo@stura.tu-dresden.de
        </a>
      </div>
      <QuizRouter theses={theses} groups={groups} />
    </>
  );
}
