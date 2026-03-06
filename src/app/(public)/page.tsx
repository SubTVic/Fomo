// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getActiveGroupCount } from "@/lib/queries/groups";

// APP_MODE controls the landing page behaviour:
//   "pilot"   → pilot survey CTA (while collecting data from Studis)
//   "collect" → pilot survey + group registration side by side
//   "live"    → full quiz (production)
const APP_MODE = (process.env.APP_MODE ?? "pilot") as "pilot" | "collect" | "live";

export default async function LandingPage() {
  const groupCount = await getActiveGroupCount();

  if (APP_MODE === "collect") {
    return <CollectModePage groupCount={groupCount} />;
  }

  if (APP_MODE === "live") {
    return <LiveModePage groupCount={groupCount} />;
  }

  return <PilotModePage />;
}

// ─── Modes ───────────────────────────────────────────────────────────────────

function PilotModePage() {
  return (
    <div className="flex flex-col items-center gap-8 px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Pilot-Studie · TU Dresden
      </p>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        FOMO – Hochschulgruppen-Finder
      </h1>
      <p className="max-w-md text-muted-foreground">
        Wir entwickeln ein Matching-Tool für Erstis. Helft uns, indem ihr unsere Pilotstudie
        ausfüllt – dauert ca. 10 Minuten.
      </p>
      <Link
        href="/pilot"
        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Zur Pilotstudie →
      </Link>
    </div>
  );
}

function CollectModePage({ groupCount }: { groupCount: number }) {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center gap-6 px-4 py-16 text-center border-b">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          TU Dresden
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          FOMO – Hochschulgruppen-Finder
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Wir bauen ein Matching-Tool für Erstis.{" "}
          <span className="font-semibold text-foreground">{groupCount} Hochschulgruppen</span> sind
          schon dabei.
        </p>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-12 grid gap-6 sm:grid-cols-2">
        <CtaCard
          emoji="🎓"
          title="Ich bin Ersti"
          description="Nimm an unserer Pilotstudie teil und hilf uns, das Matching besser zu machen."
          href="/pilot"
          label="Zur Pilotstudie →"
        />
        <CtaCard
          emoji="🏛️"
          title="Ich vertrete eine Hochschulgruppe"
          description="Registriert eure Gruppe und werdet Teil des Matchings – kostenlos, in ~15 Minuten."
          href="/groups"
          label="Gruppe registrieren →"
          secondary
        />
      </section>
    </div>
  );
}

function LiveModePage({ groupCount }: { groupCount: number }) {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center gap-6 px-4 py-20 text-center sm:py-32">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          TU Dresden
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Finde deine Hochschulgruppe
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Beantworte ~20 Fragen zu deinen Interessen und Werten – wir zeigen dir, welche der{" "}
          <span className="font-semibold text-foreground">{groupCount} Hochschulgruppen</span> am
          besten zu dir passen.
        </p>
        <Link
          href="/groups"
          className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Alle Gruppen ansehen
        </Link>
      </section>

      <section className="border-t bg-muted/40 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold">So funktioniert&apos;s</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step number={1} title="Fragen beantworten">
              ~20 kurze Fragen zu deinen Interessen, Werten und deinem Zeitbudget.
            </Step>
            <Step number={2} title="Matching berechnen">
              Unser Algorithmus vergleicht dein Profil mit den Profilen aller Hochschulgruppen –
              komplett im Browser, ohne dass Daten gespeichert werden.
            </Step>
            <Step number={3} title="Gruppen entdecken">
              Sieh dir deine Top-Empfehlungen mit Kontaktinfos, Logo und Links an.
            </Step>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function CtaCard({
  emoji,
  title,
  description,
  href,
  label,
  secondary = false,
}: {
  emoji: string;
  title: string;
  description: string;
  href: string;
  label: string;
  secondary?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <span className="text-3xl">{emoji}</span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground flex-1">{description}</p>
      <Link
        href={href}
        className={`rounded-full px-6 py-2.5 text-sm font-semibold text-center transition-opacity hover:opacity-90 ${
          secondary
            ? "border border-primary text-primary"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {label}
      </Link>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
