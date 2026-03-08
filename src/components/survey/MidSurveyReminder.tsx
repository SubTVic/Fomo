// SPDX-License-Identifier: AGPL-3.0-only
// Mid-survey context reminder shown at the halfway point (after ~30 questions).
// Re-activates the "Hochschulgruppen" frame of reference.

"use client";

interface MidSurveyReminderProps {
  onContinue: () => void;
}

export function MidSurveyReminder({ onContinue }: MidSurveyReminderProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-5 text-center">
        <div className="text-5xl">&#127919;</div>

        <h1 className="text-2xl font-bold">Halbzeit!</h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Du hast schon die H&auml;lfte geschafft &ndash; super!
        </p>

        <p className="text-base text-foreground leading-relaxed">
          Kurze Erinnerung: Beantworte die n&auml;chsten Fragen weiterhin
          mit Blick auf <strong>Hochschulgruppen an der TU Dresden</strong>.
        </p>

        <p className="text-sm text-muted-foreground">
          Noch ein paar Abschnitte, dann bist du durch. (~4 Minuten)
        </p>

        <button
          onClick={onContinue}
          className="w-full max-w-xs rounded-xl bg-primary py-4 text-primary-foreground font-semibold text-lg transition-transform active:scale-[0.98]"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
