// SPDX-License-Identifier: AGPL-3.0-only

import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getActiveGroupCount } from "@/lib/queries/groups";
import { getSiteConfig } from "@/lib/queries/site-config";

export const dynamic = "force-dynamic";

const APP_LIVE = process.env.APP_LIVE === "true";

export default async function LandingPage() {
  const [groupCount, cfg, t] = await Promise.all([
    getActiveGroupCount(),
    getSiteConfig(),
    getTranslations("landing"),
  ]);

  const groupImages = [1, 2, 3, 4, 5, 6].map((n) => ({
    src: cfg[`image_${n}_src`],
    alt: cfg[`image_${n}_alt`],
  }));

  const heroLines = cfg.hero_title.split("\n");
  const subtitleLines = cfg.hero_subtitle.split("\n");

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[1000px] border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-heading text-[clamp(26px,5vw,52px)] uppercase leading-none">
            {heroLines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <div className="text-xs sm:text-[13px] font-semibold uppercase tracking-wider text-primary-foreground/45 sm:text-right leading-snug">
            {subtitleLines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t-4 border-foreground">
          {groupImages.map((img, i) => (
            <div
              key={i}
              className="aspect-square relative overflow-hidden border-r-2 border-foreground last:border-r-0"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 167px"
              />
            </div>
          ))}
        </div>

        <div className="border-t-4 border-foreground px-6 py-2.5 sm:px-8 text-[11px] text-muted-foreground italic tracking-wide">
          {cfg.image_caption}
        </div>

        {APP_LIVE ? (
          <LiveCta groupCount={groupCount} t={t} />
        ) : (
          <PrelaunchCta groupCount={groupCount} t={t} />
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PrelaunchCta({ groupCount, t }: { groupCount: number; t: any }) {
  return (
    <>
      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            {t("prelaunch.studyLabel")}
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,28px)] uppercase leading-tight mb-2.5">
            {t("prelaunch.studyTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            {t("prelaunch.studyText")}
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/pilot"
            className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            {t("prelaunch.studyButton")}
          </Link>
          <span className="text-[11px] text-muted-foreground">{t("prelaunch.studyMeta")}</span>
        </div>
      </div>

      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center bg-accent">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            {t("prelaunch.protoLabel")}
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,24px)] uppercase leading-tight mb-2.5">
            {t("prelaunch.protoTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            {t("prelaunch.protoText")}
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/quiz"
            className="border-2 border-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors"
          >
            {t("prelaunch.protoButton")}
          </Link>
        </div>
      </div>

      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            {t("prelaunch.groupsLabel")}
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,24px)] uppercase leading-tight mb-2.5">
            {t("prelaunch.groupsTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            {t("prelaunch.groupsText", { count: groupCount })}
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/groups/register"
            className="border-2 border-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors"
          >
            {t("prelaunch.groupsButton")}
          </Link>
        </div>
      </div>

      <div className="border-t-4 border-foreground px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("prelaunch.browseText")}
        </p>
        <Link
          href="/groups"
          className="shrink-0 border-2 border-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors text-center"
        >
          {t("prelaunch.browseButton")}
        </Link>
      </div>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LiveCta({ groupCount, t }: { groupCount: number; t: any }) {
  return (
    <div className="border-t-4 border-foreground">
      <div className="px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            {t("live.quizLabel")}
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,28px)] uppercase leading-tight mb-2.5">
            {t("live.quizTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            {t("live.quizText", { count: groupCount })}
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/quiz"
            className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            {t("live.quizButton")}
          </Link>
          <span className="text-[11px] text-muted-foreground">{t("live.quizMeta")}</span>
          <Link href="/demo" className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
            {t("live.demoLink")}
          </Link>
          <Link href="/groups" className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
            {t("live.allGroupsLink")}
          </Link>
        </div>
      </div>

      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 bg-accent">
        <h3 className="font-heading text-lg uppercase mb-6">{t("live.howTitle")}</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <StepItem number={1} title={t("live.step1Title")}>
            {t("live.step1Text")}
          </StepItem>
          <StepItem number={2} title={t("live.step2Title")}>
            {t("live.step2Text")}
          </StepItem>
          <StepItem number={3} title={t("live.step3Title")}>
            {t("live.step3Text")}
          </StepItem>
        </div>
      </div>
    </div>
  );
}

function StepItem({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 w-8 items-center justify-center bg-foreground text-primary-foreground text-sm font-bold">
        {number}
      </div>
      <h4 className="font-semibold text-sm uppercase tracking-wide">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
