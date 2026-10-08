// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { GROUPS_APP_URL } from "@/lib/site";
import { track, EVENTS } from "@/lib/analytics";

/** Home page call-to-action for group representatives → the groups app. */
export function GroupsPortalLink({ lang }: { lang: "de" | "en" }) {
  const t =
    lang === "en"
      ? {
          label: "For student groups",
          title: "Your group on FOMO",
          text: "Register your student group or update your profile — so first-years find you through the quiz and the directory.",
          button: "To the group portal →",
        }
      : {
          label: "Für Hochschulgruppen",
          title: "Eure Gruppe auf FOMO",
          text: "Registriert eure Hochschulgruppe oder pflegt euer Profil — damit Erstis euch über das Quiz und das Verzeichnis finden.",
          button: "Zum Gruppenbereich →",
        };

  return (
    <section className="mt-6 border-poster bg-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
      <div>
        <p className="font-heading text-sm text-accent-muted">{t.label.toUpperCase()}</p>
        <h2 className="mt-2 text-2xl text-navy sm:text-3xl">{t.title}</h2>
        <p className="mt-2 max-w-prose text-sm text-body sm:text-base">{t.text}</p>
      </div>
      <a
        href={GROUPS_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track(EVENTS.registerClick, { context: "home" })}
        className="mt-5 block shrink-0 border-4 border-navy bg-navy px-6 py-4 text-center font-heading text-lg text-sky transition-colors hover:bg-navy-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-navy sm:mt-0"
      >
        {t.button}
      </a>
    </section>
  );
}
