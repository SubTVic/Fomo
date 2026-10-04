// SPDX-License-Identifier: AGPL-3.0-only

import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { YetiBadge } from "@/components/shared/YetiBadge";
import { PUBLIC_QUIZ_URL, PUBLIC_SITE_URL } from "@/lib/public-site";

const CONTACT_EMAIL = "fomo@yeti-dresden.org";

// Entry page for student groups ("Gruppenbereich"): everything a group may
// want to do, plus the way in for admins. The public site links here.
export default async function LandingPage() {
  const t = await getTranslations("landing");
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    t("request.mailSubject"),
  )}&body=${encodeURIComponent(t("request.mailBody"))}`;

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[1000px] border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-8 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-primary-foreground/50 mb-2">
            {t("label")}
          </p>
          <h1 className="font-heading text-[clamp(26px,5vw,48px)] uppercase leading-none mb-4">
            {t("title")}
          </h1>
          <p className="text-sm text-primary-foreground/70 max-w-lg">{t("text")}</p>
        </div>

        <div className="grid border-t-4 border-foreground sm:grid-cols-2">
          <Card title={t("register.title")} text={t("register.text")}>
            <Link href="/groups/register" className={primaryButton}>
              {t("register.button")}
            </Link>
          </Card>

          <Card title={t("edit.title")} text={t("edit.text")} />

          <Card title={t("request.title")} text={t("request.text")}>
            <a href={mailto} className={secondaryButton}>
              {t("request.button")}
            </a>
            <span className="text-xs text-muted-foreground">{CONTACT_EMAIL}</span>
          </Card>

          <Card title={t("directory.title")} text={t("directory.text")}>
            <a href={`${PUBLIC_SITE_URL}/groups/`} className={secondaryButton}>
              {t("directory.button")}
            </a>
            <a
              href={PUBLIC_QUIZ_URL}
              className="text-sm font-semibold text-foreground underline underline-offset-2"
            >
              {t("directory.quiz")}
            </a>
          </Card>
        </div>

        <div className="border-t-4 border-foreground px-6 py-4 sm:px-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <YetiBadge />
            <span>YETI</span>
            <span className="mx-1">&times;</span>
            <span>StuRa</span>
          </span>
          <span className="flex items-center gap-3">
            {t("admin.text")}
            {/* Admin pages are not localized (outside the locale proxy), so the
                plain Next link is right here; no prefetch needed. */}
            <NextLink
              href="/admin/login"
              prefetch={false}
              className="whitespace-nowrap border-2 border-foreground px-4 py-1.5 font-heading text-xs uppercase tracking-wider text-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
            >
              {t("admin.button")}
            </NextLink>
          </span>
        </div>
      </div>
    </div>
  );
}

const primaryButton =
  "inline-block bg-foreground text-primary-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] transition-colors text-center";
const secondaryButton =
  "inline-block border-2 border-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors text-center";

function Card({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b-4 border-foreground px-6 py-6 sm:px-8 sm:odd:border-r-4 [&:nth-last-child(-n+2)]:sm:border-b-0 last:border-b-0">
      <h2 className="font-heading text-lg uppercase">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
      {children && <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">{children}</div>}
    </section>
  );
}
