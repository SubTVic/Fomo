// SPDX-License-Identifier: AGPL-3.0-only
// Pilot landing page — explains the study with auto-rotating variants

import Link from "next/link";

export const metadata = {
  title: "FOMO Pilot – Mach mit!",
  description: "Hilf uns, FOMO zu gestalten. Beantworte 60 kurze Fragen zu deinen Interessen.",
};

export default function PilotLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          FOMO Pilot-Studie
        </p>
        <h1 className="text-4xl font-bold mb-4">Mach mit und gestalte FOMO!</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-2">
          Wir testen 4 verschiedene Fragebogen-Designs. Du probierst alle 4 aus und
          sagst uns am Ende, welches dir am besten gefallen hat.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          60 kurze Aussagen · ca. 10 Minuten · Keine Anmeldung · Anonym
        </p>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-2xl px-4 pb-8">
        <h2 className="text-xl font-semibold mb-6 text-center">So funktioniert&apos;s:</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { step: "1", emoji: "\uD83C\uDFB2", text: "Die Reihenfolge der 4 Layouts wird zuf\u00E4llig gemischt" },
            { step: "2", emoji: "\u2753", text: "Du beantwortest je einen Block Fragen pro Layout" },
            { step: "3", emoji: "\u2B50", text: "Am Ende w\u00E4hlst du dein Lieblingslayout" },
            { step: "4", emoji: "\uD83D\uDCCA", text: "Dein Feedback hilft uns, das beste Design zu finden" },
          ].map(({ step, emoji, text }) => (
            <div key={step} className="flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{emoji}</span>
              <p className="text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto max-w-2xl px-4 pb-16 text-center">
        <Link
          href="/pilot/survey"
          className="inline-block rounded-xl bg-primary px-10 py-4 text-primary-foreground font-semibold text-lg transition-transform active:scale-[0.98] hover:opacity-90"
        >
          Studie starten
        </Link>

        {process.env.NODE_ENV === "development" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Entwickler?{" "}
            <Link
              href="/pilot/survey?dev=true"
              className="underline hover:no-underline"
            >
              Mit Dev-Panel starten
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
