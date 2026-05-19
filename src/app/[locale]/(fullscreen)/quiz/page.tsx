// SPDX-License-Identifier: AGPL-3.0-only

import { getActiveQuizTheses, getQuizGroups } from "@/lib/queries/quiz";
import { getTranslations } from "next-intl/server";
import { QuizRouter } from "@/components/quiz/QuizRouter";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [theses, groups, t] = await Promise.all([
    getActiveQuizTheses(locale),
    getQuizGroups(),
    getTranslations("quiz"),
  ]);

  return (
    <>
      <div className="sticky top-0 z-50 bg-yellow-50 border-b-2 border-foreground px-4 py-2 text-xs text-foreground text-center">
        <span dangerouslySetInnerHTML={{ __html: t("protoWarning") }} />{" "}
        <a href="mailto:victor.kling@yeti-dresden.org" className="underline">
          victor.kling@yeti-dresden.org
        </a>
      </div>
      <QuizRouter theses={theses} groups={groups} />
    </>
  );
}
