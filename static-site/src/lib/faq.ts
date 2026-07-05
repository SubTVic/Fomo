// SPDX-License-Identifier: AGPL-3.0-only
// Landing-page FAQ. Single source for the visible section AND the FAQPage
// JSON-LD (Google requires the markup to match on-page content). The questions
// are phrased like real search queries ("Welche Hochschulgruppen gibt es an
// der TU Dresden?") — that is the point: they target generic, non-brand
// searches students actually type.

export interface FaqEntry {
  q: string;
  a: string;
}

export const FAQ_DE: FaqEntry[] = [
  {
    q: "Was ist eine Hochschulgruppe?",
    a: "Hochschulgruppen sind vom Studierendenrat (StuRa) anerkannte studentische Vereine und Initiativen. Dort gehen Studierende gemeinsam ihren Interessen nach — und das kann fast alles sein: ein Rennauto bauen, eine Bar betreiben, Theater spielen oder einfach der Austausch mit Gleichgesinnten.",
  },
  {
    q: "Welche Hochschulgruppen gibt es an der TU Dresden?",
    a: "An der TU Dresden gibt es über 90 studentische Hochschulgruppen und Vereine — von Sport, Musik und Theater über Robotik, Coding und Rennwagenbau bis zu Ehrenamt, Nachhaltigkeit, Hochschulpolitik und internationalen Communities. FOMO listet sie alle mit Beschreibung und Kontakt.",
  },
  {
    q: "Wie finde ich die passende Hochschulgruppe für mich?",
    a: "Am schnellsten mit dem FOMO-Quiz: Du beantwortest 21 kurze Fragen zu deinen Interessen und deinem Zeitbudget, und FOMO vergleicht deine Antworten mit den Selbstauskünften der Gruppen. Das dauert etwa 3 Minuten, ist anonym und läuft komplett in deinem Browser.",
  },
  {
    q: "Kostet FOMO etwas? Muss ich mich anmelden?",
    a: "Nein. FOMO ist kostenlos, ohne Anmeldung und anonym — deine Antworten werden keiner Person zugeordnet. Das Projekt wird von der Hochschulgruppe YETI mit dem StuRa der TU Dresden betrieben.",
  },
  {
    q: "Kann ich auch ohne Vorerfahrung in einer Hochschulgruppe mitmachen?",
    a: "In den meisten Fällen ja. Viele Gruppen sind ausdrücklich anfängerfreundlich und nehmen neue Mitglieder ohne Vorkenntnisse auf. Im Quiz kannst du angeben, dass du direkt einsteigen willst — das fließt ins Matching ein.",
  },
  {
    q: "Wann ist die beste Zeit, um einer Hochschulgruppe beizutreten?",
    a: "Jederzeit — die meisten Gruppen freuen sich das ganze Jahr über Zulauf. Besonders leicht ist der Einstieg zum Semesterstart und in der Erstsemesterwoche, wenn viele Gruppen Kennenlern-Events anbieten.",
  },
];

export const FAQ_EN: FaqEntry[] = [
  {
    q: "What is a Hochschulgruppe (student group)?",
    a: "Hochschulgruppen are student clubs and initiatives officially recognised by the student council (StuRa). Students pursue shared interests together — and that can be almost anything: building a race car, running a bar, doing theatre, or simply connecting with like-minded people.",
  },
  {
    q: "Which student groups exist at TU Dresden?",
    a: "TU Dresden has over 90 student groups — from sports, music and theatre to robotics, coding and race-car building, plus volunteering, sustainability, student politics and international communities. FOMO lists them all with a description and contact details.",
  },
  {
    q: "How do I find the right student group for me?",
    a: "Take the FOMO quiz: answer 21 short questions about your interests and time budget, and FOMO compares your answers with each group's self-assessment. It takes about 3 minutes, is anonymous and runs entirely in your browser.",
  },
  {
    q: "Is FOMO free? Do I need an account?",
    a: "Yes, it is free — no sign-up, fully anonymous. The project is run by the student group YETI together with the StuRa of TU Dresden.",
  },
  {
    q: "Can I join a group without prior experience?",
    a: "Usually yes. Many groups are explicitly beginner-friendly and welcome new members without any prerequisites — the quiz takes this preference into account.",
  },
];

/** schema.org FAQPage JSON-LD from the entries above. */
export function faqPageLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.q,
      acceptedAnswer: { "@type": "Answer", text: e.a },
    })),
  };
}
