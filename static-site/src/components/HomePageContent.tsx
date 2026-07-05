// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";
import { FAQ_DE, FAQ_EN } from "@/lib/faq";

type Lang = "de" | "en";

const copy = {
  de: {
    eyebrow: "TU DRESDEN",
    title: "Finde deine Hochschulgruppe",
    intro:
      "Über 92 Gruppen, eine Frage: Wo passt du rein? Beantworte 21 kurze Fragen und FOMO zeigt dir deine besten Matches — Sport, Tech, Kunst, Engagement und mehr.",
    quiz: "Mach den Test",
    groups: "Alle Hochschulgruppen",
    contactTitle: "Fragen oder Anmerkungen?",
    contactText: "Bitte wende dich direkt an uns.",
  },
  en: {
    eyebrow: "TU DRESDEN",
    title: "Find your student group",
    intro:
      "Over 92 groups, one question: where do you fit in? Answer 21 short questions and FOMO shows your best matches — sports, tech, arts, volunteering and more.",
    quiz: "Take the test",
    groups: "All student groups",
    contactTitle: "Questions or feedback?",
    contactText: "Please contact us directly.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function HomePageContent({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const prefix = lang === "en" ? "/en" : "";

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-12 sm:px-6">
      <section className="mt-6 border-poster bg-card p-6 poster-shadow sm:mt-10 sm:p-10">
        <p className="font-heading text-sm text-accent-muted sm:text-base">{t.eyebrow}</p>
        <h1 className="mt-3 hyphens-auto break-words text-[2rem] leading-tight text-navy sm:text-6xl">
          {t.title}
        </h1>
        <p className="mt-5 max-w-prose text-base leading-relaxed text-body sm:text-lg">
          {t.intro}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href={`${prefix}/quiz`}
            className="border-4 border-navy bg-navy px-6 py-4 text-center font-heading text-lg text-sky transition-colors hover:bg-navy-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-navy"
          >
            {t.quiz}
          </Link>
          <Link
            href={`${prefix}/groups`}
            className="border-4 border-navy px-6 py-4 text-center font-heading text-lg text-navy transition-colors hover:bg-sky focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-navy"
          >
            {t.groups}
          </Link>
        </div>
      </section>

      {/* Visible FAQ — must stay in sync with the FAQPage JSON-LD (same source). */}
      <section className="mt-6 border-poster bg-card p-6 sm:p-10">
        <h2 className="text-2xl text-navy sm:text-3xl">
          {lang === "de" ? "Häufige Fragen" : "Frequently asked questions"}
        </h2>
        <div className="mt-4 divide-y-2 divide-navy/15">
          {(lang === "de" ? FAQ_DE : FAQ_EN).map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="cursor-pointer list-none font-heading text-base text-navy marker:content-none">
                <span className="mr-2 inline-block transition-transform group-open:rotate-90">→</span>
                {f.q}
              </summary>
              <p className="mt-2 max-w-prose pl-6 text-sm text-body">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6 border-poster bg-card p-5 text-center sm:p-6">
        <p className="font-heading text-lg text-navy sm:text-xl">{t.contactTitle}</p>
        <p className="mx-auto mt-2 max-w-prose text-sm text-body">{t.contactText}</p>
        <a
          href="mailto:fomo@yeti-dresden.org"
          className="mt-4 inline-flex border-4 border-navy bg-navy px-5 py-3 text-center font-heading text-sm text-sky transition-colors hover:bg-navy-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-navy sm:text-base"
        >
          fomo@yeti-dresden.org
        </a>
      </section>
    </div>
  );
}
