// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";

export default function Study2IntroPage() {
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[800px] border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-primary-foreground/45 mb-2">
            Studie für Mitglieder
          </p>
          <h1 className="font-heading text-[clamp(26px,5vw,44px)] uppercase leading-none">
            Hilf uns, FOMO besser zu machen
          </h1>
        </div>

        <Section title="Wer wird gesucht">
          Du bist Mitglied einer Hochschulgruppe an der TU Dresden? Dann brauchen wir dich.
        </Section>
        <Section title="Warum wir dich brauchen">
          Wir wollen prüfen, ob unser Quiz dich tatsächlich zu deiner Gruppe matchen würde.
          Dafür beantwortest du 20 Fragen wie ein Erstsemester, der gerade nach einer Gruppe
          sucht. So können wir messen, welche Fragen funktionieren und welche raus müssen.
        </Section>
        <Section title="Was passiert mit den Daten">
          Komplett anonym. Kein Account. Keine personenbezogenen Daten. Wir speichern nur
          deine Antworten und welche Gruppe du angegeben hast.
        </Section>
        <Section title="Dauer">~5 Minuten.</Section>
        <Section title="Was du bekommst">
          Am Ende zeigen wir dir, welche der ~80 Hochschulgruppen am besten zu deinen
          Antworten passen — und ob deine eigene Gruppe darunter ist.
        </Section>

        <div className="border-t-4 border-foreground px-6 py-8 sm:px-8 flex flex-col items-center gap-2">
          <Link
            href="/pilot/quiz"
            className="bg-foreground text-primary-foreground px-10 py-4 font-heading text-base uppercase tracking-wider hover:bg-[#2a3a45] transition-colors"
          >
            Studie starten
          </Link>
          <span className="text-[11px] text-muted-foreground">
            Anonym · Im Browser · ~5 Min
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-4 border-foreground px-6 py-6 sm:px-8">
      <h2 className="font-heading text-lg uppercase mb-3">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
