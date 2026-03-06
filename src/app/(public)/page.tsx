// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getActiveGroupCount } from "@/lib/queries/groups";

export default async function LandingPage() {
  const groupCount = await getActiveGroupCount();

  return (
    <div className="flex flex-col">
      {/* Hero */}
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/quiz"
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Quiz starten
          </Link>
          <Link
            href="/groups"
            className="rounded-full border px-8 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Alle Gruppen ansehen
          </Link>
        </div>
      </section>

      {/* How it works */}
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
