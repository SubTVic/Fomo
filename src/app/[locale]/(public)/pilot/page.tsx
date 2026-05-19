// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Study2IntroPage() {
  const t = await getTranslations("pilot");
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[800px] border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-primary-foreground/45 mb-2">
            {t("metaLabel")}
          </p>
          <h1 className="font-heading text-[clamp(26px,5vw,44px)] uppercase leading-none">
            {t("title")}
          </h1>
        </div>

        <Section title={t("who.title")}>{t("who.text")}</Section>
        <Section title={t("why.title")}>{t("why.text")}</Section>
        <Section title={t("data.title")}>{t("data.text")}</Section>
        <Section title={t("duration.title")}>{t("duration.text")}</Section>
        <Section title={t("reward.title")}>{t("reward.text")}</Section>

        <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 flex flex-col items-center gap-2">
          <Link
            href="/pilot/quiz"
            className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            {t("startButton")}
          </Link>
          <span className="text-[11px] text-muted-foreground">{t("meta")}</span>
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
