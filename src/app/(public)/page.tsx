// SPDX-License-Identifier: AGPL-3.0-only

import Image from "next/image";
import Link from "next/link";
import { getActiveGroupCount } from "@/lib/queries/groups";
import { getSiteConfig } from "@/lib/queries/site-config";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [groupCount, cfg] = await Promise.all([
    getActiveGroupCount(),
    getSiteConfig(),
  ]);

  // Build image array from config
  const groupImages = [1, 2, 3, 4, 5, 6].map((n) => ({
    src: cfg[`image_${n}_src`],
    alt: cfg[`image_${n}_alt`],
  }));

  // Render hero title with line breaks
  const heroLines = cfg.hero_title.split("\n");
  const subtitleLines = cfg.hero_subtitle.split("\n");

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      {/* Poster Card */}
      <div className="w-full max-w-[1000px] border-4 border-foreground bg-card">
        {/* Poster Header */}
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

        {/* Image Grid */}
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

        {/* Image Caption */}
        <div className="border-t-4 border-foreground px-6 py-2.5 sm:px-8 text-[11px] text-muted-foreground italic tracking-wide">
          {cfg.image_caption}
        </div>

        {/* CTA Section */}
        <LiveCta groupCount={groupCount} />

      </div>
    </div>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function LiveCta({ groupCount }: { groupCount: number }) {
  return (
    <div className="border-t-4 border-foreground">
      {/* Quiz CTA */}
      <div className="px-6 py-10 sm:px-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground mb-2">
            Dein Weg zu deiner Gruppe
          </p>
          <h2 className="font-heading text-[clamp(20px,4vw,32px)] uppercase leading-tight mb-3">
            Finde dein Match
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[480px] mb-4">
            Beantworte ~20 kurze Fragen zu deinen Interessen und Werten — wir zeigen dir, welche der{" "}
            <strong className="text-foreground">{groupCount} Hochschulgruppen</strong> am besten zu dir passen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge icon="⏱" text="3 Minuten" />
            <Badge icon="🔒" text="100% anonym" />
            <Badge icon="📱" text="Im Browser" />
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-3">
          <Link
            href="/quiz"
            className="bg-foreground text-primary-foreground px-12 py-5 font-heading text-lg uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            Quiz starten
          </Link>
          <span className="text-[11px] text-muted-foreground">Kostenlos · Keine Anmeldung</span>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 bg-accent">
        <h3 className="font-heading text-lg uppercase mb-6">So funktioniert&apos;s</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <StepItem number={1} title="Fragen beantworten">
            ~20 kurze Fragen zu deinen Interessen, Werten und deinem Zeitbudget. Ehrlich antworten — es gibt kein Richtig oder Falsch.
          </StepItem>
          <StepItem number={2} title="Matching berechnen">
            Unser Algorithmus vergleicht dein Profil mit allen Hochschulgruppen — komplett in deinem Browser. Keine Daten werden an uns gesendet.
          </StepItem>
          <StepItem number={3} title="Gruppen entdecken">
            Sieh deine Top-Empfehlungen mit Match-Prozent, Beschreibung und Kontaktinfos. Direkt zur Website oder Instagram.
          </StepItem>
        </div>
      </div>

      {/* Privacy note */}
      <div className="border-t-4 border-foreground px-6 py-6 sm:px-8">
        <div className="flex items-start gap-3">
          <span className="text-lg">🛡️</span>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-1">Datenschutz</h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[500px]">
              Deine Antworten verlassen niemals deinen Browser. Das Matching passiert lokal auf deinem Gerät — kein Login, keine Cookies, keine Speicherung deiner Ergebnisse.
            </p>
          </div>
        </div>
      </div>

      {/* Explore groups link */}
      <div className="border-t-4 border-foreground px-6 py-6 sm:px-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center bg-accent">
        <div>
          <h3 className="font-heading text-base uppercase mb-1">
            Lieber selbst stöbern?
          </h3>
          <p className="text-sm text-muted-foreground">
            Alle {groupCount} Hochschulgruppen im Überblick — filtere nach Kategorie und Interessen.
          </p>
        </div>
        <Link
          href="/groups"
          className="border-2 border-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider text-center hover:bg-foreground hover:text-primary-foreground transition-colors"
        >
          Alle Gruppen ansehen
        </Link>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-foreground/20 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span>{icon}</span>
      {text}
    </span>
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
