// SPDX-License-Identifier: AGPL-3.0-only

import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { YetiBadge } from "@/components/shared/YetiBadge";
import { PUBLIC_SITE_URL } from "@/lib/public-site";
import { db } from "@/lib/db";
import { RequestEditLink, type PickableGroup } from "@/components/landing/RequestEditLink";

/** Active groups for the "Link beantragen" picker — public data only. */
async function getPickableGroups(): Promise<PickableGroup[] | null> {
  try {
    const groups = await db.group.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
    });
    return groups.sort((a, b) => a.name.localeCompare(b.name, "de"));
  } catch {
    // DB unreachable — the landing page must still work (fallback: mail address).
    return null;
  }
}

// Entry page of the registration app: register, edit, or go to the public site
// (quiz and directory live there).
export default async function LandingPage() {
  const t = await getTranslations("landing");
  const groups = await getPickableGroups();

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

        <Section title={t("register.title")} text={t("register.text")}>
          <Link
            href="/groups/register"
            className="shrink-0 bg-foreground text-primary-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] transition-colors text-center"
          >
            {t("register.button")}
          </Link>
        </Section>

        <Section title={t("edit.title")} text={t("edit.text")}>
          <RequestEditLink groups={groups} />
        </Section>

        <Section title={t("site.title")} text={t("site.text")}>
          <a
            href={PUBLIC_SITE_URL}
            className="shrink-0 border-2 border-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors text-center"
          >
            {t("site.button")}
          </a>
        </Section>

        {/* YETI × StuRa branding — only on mobile (navbar shows it on desktop) */}
        <div className="sm:hidden border-t-4 border-foreground px-6 py-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <YetiBadge />
          <span>YETI</span>
          <span className="mx-1">&times;</span>
          <span>StuRa</span>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  text,
  children,
}: {
  title: string;
  text: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t-4 border-foreground px-6 py-6 sm:px-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="sm:min-w-0 sm:flex-1">
        <h2 className="font-heading text-lg uppercase mb-1">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-[520px]">{text}</p>
      </div>
      {children}
    </div>
  );
}
