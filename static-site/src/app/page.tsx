// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";
import { getGroups, getQuizItems } from "@/lib/data";

export default function HomePage() {
  const groupCount = getGroups().length;
  const itemCount = getQuizItems().length;

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6">
      {/* Hero */}
      <section className="mt-6 border-poster bg-card p-6 poster-shadow sm:mt-10 sm:p-10">
        <p className="font-heading text-sm text-accent-muted sm:text-base">
          TU DRESDEN · ERSTSEMESTER
        </p>
        <h1 className="mt-3 text-4xl text-navy sm:text-6xl">
          Finde deine
          <br />
          Hochschulgruppe.
        </h1>
        <p className="mt-5 max-w-prose text-base text-body sm:text-lg">
          Über {groupCount} Gruppen, eine Frage: Wo passt du rein? Beantworte {itemCount} kurze
          Fragen und FOMO zeigt dir deine besten Matches — Sport, Tech, Kunst, Engagement und
          mehr.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/quiz"
            className="border-poster bg-navy px-6 py-4 text-center font-heading text-lg text-sky transition-colors hover:bg-navy-hover"
          >
            Quiz starten →
          </Link>
          <Link
            href="/groups"
            className="border-poster bg-card px-6 py-4 text-center font-heading text-lg text-navy transition-colors hover:bg-surface"
          >
            Alle Gruppen anzeigen
          </Link>
        </div>

        <p className="mt-5 text-xs uppercase tracking-wider text-muted">
          100% anonym · Matching läuft in deinem Browser · Keine Anmeldung
        </p>
      </section>

      {/* How it works */}
      <section className="my-10">
        <h2 className="text-2xl text-navy sm:text-3xl">So funktioniert&apos;s</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Filtern",
              d: "Wähle, was du tun willst — oder lass alles offen.",
            },
            {
              n: "02",
              t: "Antworten",
              d: `${itemCount} kurze Fragen, eine pro Screen. Stimme zu, neutral oder nicht.`,
            },
            {
              n: "03",
              t: "Matchen",
              d: "Sieh sofort deine Top-Gruppen mit Kontakt und Links.",
            },
          ].map((step) => (
            <div key={step.n} className="border-poster bg-card p-5">
              <span className="font-heading text-3xl text-sky [text-shadow:_2px_2px_0_#1a2a35]">
                {step.n}
              </span>
              <h3 className="mt-2 text-lg text-navy">{step.t}</h3>
              <p className="mt-1 text-sm text-body">{step.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
