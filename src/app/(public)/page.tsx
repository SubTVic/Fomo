// SPDX-License-Identifier: AGPL-3.0-only

import Image from "next/image";
import Link from "next/link";
import { getActiveGroupCount } from "@/lib/queries/groups";

// APP_MODE controls the landing page behaviour:
//   "pilot"   → pilot survey CTA (while collecting data from Studis)
//   "collect" → pilot survey + group registration side by side
//   "live"    → full quiz (production)
export const dynamic = "force-dynamic";

const APP_MODE = (process.env.APP_MODE ?? "pilot") as "pilot" | "collect" | "live";

// Group images for the landing page grid
const GROUP_IMAGES = [
  { src: "/images/groups/Campusradio.jpeg", alt: "Campusradio Dresden" },
  { src: "/images/groups/Club11.jpg", alt: "Club 11" },
  { src: "/images/groups/DieBuilhne.jpeg", alt: "Die Bühne" },
  { src: "/images/groups/Elbflorace.png", alt: "Elbflorace" },
  { src: "/images/groups/Star.jpeg", alt: "STAR Dresden" },
  { src: "/images/groups/Yeti.jpeg", alt: "YETI" },
];

const GROUP_NAMES = "Campusradio Dresden · Club 11 · Die Bühne · Elbflorace · STAR Dresden · YETI";

export default async function LandingPage() {
  const groupCount = await getActiveGroupCount();

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      {/* Poster Card */}
      <div className="w-full max-w-[1000px] border-4 border-foreground bg-card">
        {/* Poster Header */}
        <div className="bg-foreground text-primary-foreground px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-heading text-[clamp(26px,5vw,52px)] uppercase leading-none">
            Finde deine
            <br />
            Hochschulgruppe
          </h1>
          <div className="text-xs sm:text-[13px] font-semibold uppercase tracking-wider text-primary-foreground/45 sm:text-right leading-snug">
            Launching
            <br />
            WS 2026
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t-4 border-foreground">
          {GROUP_IMAGES.map((img, i) => (
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

        {/* Image Caption */}
        <div className="border-t-4 border-foreground px-6 py-2.5 sm:px-8 text-[11px] text-muted-foreground italic tracking-wide">
          {GROUP_NAMES} — 6 von über {groupCount > 0 ? groupCount : 100} Hochschulgruppen
        </div>

        {/* CTA Section (mode-dependent) */}
        {APP_MODE === "pilot" && <PilotCta />}
        {APP_MODE === "collect" && <CollectCta groupCount={groupCount} />}
        {APP_MODE === "live" && <LiveCta groupCount={groupCount} />}

      </div>
    </div>
  );
}

// ─── CTA Sections ─────────────────────────────────────────────────────────────

function PilotCta() {
  return (
    <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
          Pilotstudie
        </p>
        <h2 className="font-heading text-[clamp(18px,3vw,28px)] uppercase leading-tight mb-2.5">
          Hilf uns, FOMO zu bauen
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
          Wir entwickeln ein Open-Source-Tool für über 100 Hochschulgruppen in Dresden.
          Euer Feedback formt das Ergebnis — die Umfrage dauert nur wenige Minuten.
        </p>
      </div>
      <div className="flex flex-col items-center sm:items-end gap-2">
        <Link
          href="/pilot"
          className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
        >
          Zur Pilotstudie
        </Link>
        <span className="text-[11px] text-muted-foreground">~ 5 Min &middot; Anonym</span>
      </div>
    </div>
  );
}

function CollectCta({ groupCount }: { groupCount: number }) {
  return (
    <div className="border-t-4 border-foreground">
      {/* Ersti CTA */}
      <div className="px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            Pilotstudie
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,28px)] uppercase leading-tight mb-2.5">
            Hilf uns, FOMO zu bauen
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            Wir entwickeln ein Open-Source-Tool für über 100 Hochschulgruppen in Dresden.
            Euer Feedback formt das Ergebnis — die Umfrage dauert nur wenige Minuten.
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/pilot"
            className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            Zur Pilotstudie
          </Link>
          <span className="text-[11px] text-muted-foreground">~ 5 Min &middot; Anonym</span>
        </div>
      </div>

      {/* Group registration CTA */}
      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center bg-accent">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            Hochschulgruppen
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,24px)] uppercase leading-tight mb-2.5">
            Registriert eure Gruppe
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            {groupCount} Gruppen sind schon dabei. Registrierung kostenlos, in ~15 Minuten.
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/groups/register"
            className="border-2 border-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-foreground hover:text-primary-foreground transition-colors"
          >
            Gruppe registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}

function LiveCta({ groupCount }: { groupCount: number }) {
  return (
    <div className="border-t-4 border-foreground">
      {/* Quiz CTA */}
      <div className="px-6 py-8 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            Quiz starten
          </p>
          <h2 className="font-heading text-[clamp(18px,3vw,28px)] uppercase leading-tight mb-2.5">
            Finde dein Match
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px]">
            Beantworte ~20 Fragen zu deinen Interessen und Werten — wir zeigen dir, welche der{" "}
            {groupCount} Hochschulgruppen am besten zu dir passen.
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <Link
            href="/quiz"
            className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            Quiz starten
          </Link>
          <span className="text-[11px] text-muted-foreground">~ 5 Min &middot; Anonym &middot; Im Browser</span>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 bg-accent">
        <h3 className="font-heading text-lg uppercase mb-6">So funktioniert&apos;s</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <StepItem number={1} title="Fragen beantworten">
            ~20 kurze Fragen zu deinen Interessen, Werten und deinem Zeitbudget.
          </StepItem>
          <StepItem number={2} title="Matching berechnen">
            Unser Algorithmus vergleicht dein Profil mit den Profilen aller Hochschulgruppen — komplett im Browser.
          </StepItem>
          <StepItem number={3} title="Gruppen entdecken">
            Sieh dir deine Top-Empfehlungen mit Kontaktinfos, Logo und Links an.
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
