// SPDX-License-Identifier: AGPL-3.0-only
// Pilot survey: 10 dimensions × 6 questions = 60 Likert questions
// Questions are hardcoded here; responses are stored in PilotSession/PilotAnswer in the DB

export interface Dimension {
  id: string; // "D1"
  label: string; // "Zeitbudget & Verbindlichkeit"
  emoji: string; // "⏰"
  description: string; // Short explanation shown to users
}

export interface PilotQuestion {
  id: string; // "D1Q1"
  dimensionId: string; // "D1"
  text: string; // Statement in first person (Ich-Form)
}

export const DIMENSIONS: Dimension[] = [
  {
    id: "D1",
    label: "Zeitbudget & Verbindlichkeit",
    emoji: "⏰",
    description: "Wie viel Zeit und Verbindlichkeit möchtest du einbringen?",
  },
  {
    id: "D2",
    label: "Hands-on vs. Theoretisch",
    emoji: "🔨",
    description: "Praktisch anpacken oder konzeptionell denken – was liegt dir mehr?",
  },
  {
    id: "D3",
    label: "Sozialstil",
    emoji: "👥",
    description: "Wie möchtest du mit anderen in der Gruppe interagieren?",
  },
  {
    id: "D4",
    label: "Politisches Engagement",
    emoji: "📢",
    description: "Wie wichtig ist dir gesellschaftliches oder politisches Engagement?",
  },
  {
    id: "D5",
    label: "Kreativität",
    emoji: "🎨",
    description: "Spielen kreative Projekte und künstlerischer Ausdruck eine Rolle?",
  },
  {
    id: "D6",
    label: "Werte & Weltanschauung",
    emoji: "🌱",
    description: "Sollen gemeinsame Werte oder eine Weltanschauung die Gruppe prägen?",
  },
  {
    id: "D7",
    label: "Internationalität",
    emoji: "🌍",
    description: "Wie wichtig ist dir internationaler Austausch und Diversität?",
  },
  {
    id: "D8",
    label: "Kompetitivität",
    emoji: "🏆",
    description: "Motivieren dich Wettbewerbe, Ranglistenplätze und messbare Leistung?",
  },
  {
    id: "D9",
    label: "Digital vs. Analog",
    emoji: "💻",
    description: "Arbeitest du lieber mit digitalen Tools oder analog vor Ort?",
  },
  {
    id: "D10",
    label: "Einstiegsfreundlichkeit",
    emoji: "🚀",
    description: "Wie wichtig ist dir ein niedrigschwelliger, anfängerfreundlicher Einstieg?",
  },
];

export const PILOT_QUESTIONS: PilotQuestion[] = [
  // ── D1: Zeitbudget & Verbindlichkeit ──────────────────────────
  {
    id: "D1Q1",
    dimensionId: "D1",
    text: "Ich kann mir vorstellen, mehr als 5 Stunden pro Woche für eine Hochschulgruppe aufzuwenden.",
  },
  {
    id: "D1Q2",
    dimensionId: "D1",
    text: "Ich möchte mich langfristig (mindestens 2 Semester) in einer Gruppe engagieren.",
  },
  {
    id: "D1Q3",
    dimensionId: "D1",
    text: "Feste, regelmäßige Treffen (z.B. wöchentlich) sind mir wichtig.",
  },
  {
    id: "D1Q4",
    dimensionId: "D1",
    text: "Klare Erwartungen und Verbindlichkeiten in einer Gruppe schätze ich sehr.",
  },
  {
    id: "D1Q5",
    dimensionId: "D1",
    text: "Ich möchte in einer Gruppe Verantwortung übernehmen, z.B. als Projektleiterin oder im Vorstand.",
  },
  {
    id: "D1Q6",
    dimensionId: "D1",
    text: "Ein intensives, verbindliches Engagement ist mir lieber als eine lockere Mitgliedschaft.",
  },

  // ── D2: Hands-on vs. Theoretisch ──────────────────────────────
  {
    id: "D2Q1",
    dimensionId: "D2",
    text: "Ich lerne lieber durch praktisches Tun als durch Theorie und Diskussion.",
  },
  {
    id: "D2Q2",
    dimensionId: "D2",
    text: "Projekte mit einem konkreten, sichtbaren Ergebnis motivieren mich besonders.",
  },
  {
    id: "D2Q3",
    dimensionId: "D2",
    text: "Ich bin gerne im Labor, in der Werkstatt oder direkt im Feld aktiv.",
  },
  {
    id: "D2Q4",
    dimensionId: "D2",
    text: "Ich möchte handwerkliche, technische oder gestalterische Fähigkeiten in der Gruppe einsetzen.",
  },
  {
    id: "D2Q5",
    dimensionId: "D2",
    text: "Strategische Planung und konzeptionelle Arbeit machen mir genauso viel Spaß wie die Umsetzung.",
  },
  {
    id: "D2Q6",
    dimensionId: "D2",
    text: "Theorie, Debatten und intellektuelle Auseinandersetzung sind mir genauso wichtig wie die Praxis.",
  },

  // ── D3: Sozialstil ─────────────────────────────────────────────
  {
    id: "D3Q1",
    dimensionId: "D3",
    text: "Ich suche eine Hochschulgruppe vor allem, um neue Freundschaften zu schließen.",
  },
  {
    id: "D3Q2",
    dimensionId: "D3",
    text: "Networking und der Aufbau beruflicher Kontakte sind mir in einer Gruppe wichtig.",
  },
  {
    id: "D3Q3",
    dimensionId: "D3",
    text: "Ich bevorzuge kleine, überschaubare Gruppen mit weniger als 20 aktiven Mitgliedern.",
  },
  {
    id: "D3Q4",
    dimensionId: "D3",
    text: "Ich fühle mich in großen, lebhaften Gruppen mit vielen verschiedenen Menschen wohl.",
  },
  {
    id: "D3Q5",
    dimensionId: "D3",
    text: "Gemeinsame Feiern, Ausflüge und Socializing-Events sind für mich ein wichtiger Teil einer Gruppe.",
  },
  {
    id: "D3Q6",
    dimensionId: "D3",
    text: "Intensive Zusammenarbeit in einem kleinen, eng vernetzten Team motiviert mich am meisten.",
  },

  // ── D4: Politisches Engagement ─────────────────────────────────
  {
    id: "D4Q1",
    dimensionId: "D4",
    text: "Ich möchte gesellschaftlichen Wandel aktiv mitgestalten.",
  },
  {
    id: "D4Q2",
    dimensionId: "D4",
    text: "Politisches oder soziales Engagement ist ein wichtiger Teil meines Studiums für mich.",
  },
  {
    id: "D4Q3",
    dimensionId: "D4",
    text: "Ich interessiere mich für Hochschulpolitik und studentische Mitbestimmung.",
  },
  {
    id: "D4Q4",
    dimensionId: "D4",
    text: "Ich möchte mich für benachteiligte oder marginalisierte Gruppen einsetzen.",
  },
  {
    id: "D4Q5",
    dimensionId: "D4",
    text: "Umweltschutz und Klimagerechtigkeit sind für mich zentrale Themen.",
  },
  {
    id: "D4Q6",
    dimensionId: "D4",
    text: "Ich bevorzuge eine Gruppe ohne expliziten politischen oder gesellschaftlichen Anspruch.",
  },

  // ── D5: Kreativität ────────────────────────────────────────────
  {
    id: "D5Q1",
    dimensionId: "D5",
    text: "Kreatives Gestalten – z.B. Schreiben, Zeichnen, Fotografieren oder Musik – liegt mir sehr am Herzen.",
  },
  {
    id: "D5Q2",
    dimensionId: "D5",
    text: "Ich möchte in einer Gruppe eigene künstlerische Projekte realisieren.",
  },
  {
    id: "D5Q3",
    dimensionId: "D5",
    text: "Kulturelle Veranstaltungen zu organisieren oder mitzugestalten macht mir Spaß.",
  },
  {
    id: "D5Q4",
    dimensionId: "D5",
    text: "Improvisation und kreative Freiheit schätze ich mehr als starre Strukturen.",
  },
  {
    id: "D5Q5",
    dimensionId: "D5",
    text: "Ich möchte meine kreativen Fähigkeiten aktiv in einer Hochschulgruppe einbringen.",
  },
  {
    id: "D5Q6",
    dimensionId: "D5",
    text: "Ästhetik, Design und visuelle Gestaltung spielen in meiner Arbeit eine wichtige Rolle.",
  },

  // ── D6: Werte & Weltanschauung ─────────────────────────────────
  {
    id: "D6Q1",
    dimensionId: "D6",
    text: "Mein Glaube oder meine Weltanschauung soll in der Gruppe eine sichtbare Rolle spielen.",
  },
  {
    id: "D6Q2",
    dimensionId: "D6",
    text: "Ethische Prinzipien und Wertfragen leiten meine Entscheidungen stark.",
  },
  {
    id: "D6Q3",
    dimensionId: "D6",
    text: "Nachhaltigkeit und ökologisches Handeln sind für mich unverzichtbare Gruppenmerkmale.",
  },
  {
    id: "D6Q4",
    dimensionId: "D6",
    text: "Ich suche eine Gemeinschaft, die geteilte Werte und eine gemeinsame Identität hat.",
  },
  {
    id: "D6Q5",
    dimensionId: "D6",
    text: "Spirituelle oder philosophische Fragen beschäftigen mich und sollen Raum in der Gruppe haben.",
  },
  {
    id: "D6Q6",
    dimensionId: "D6",
    text: "Mir ist wichtig, mit Menschen zusammenzukommen, die ähnlich denken und ähnliche Überzeugungen teilen.",
  },

  // ── D7: Internationalität ──────────────────────────────────────
  {
    id: "D7Q1",
    dimensionId: "D7",
    text: "Ich möchte in der Gruppe internationale Studierende kennenlernen.",
  },
  {
    id: "D7Q2",
    dimensionId: "D7",
    text: "Ich setze gerne meine Fremdsprachenkenntnisse in einer Hochschulgruppe ein.",
  },
  {
    id: "D7Q3",
    dimensionId: "D7",
    text: "Interkultureller Austausch ist für mich ein wesentlicher Mehrwert einer Gruppe.",
  },
  {
    id: "D7Q4",
    dimensionId: "D7",
    text: "Ich plane, ins Ausland zu gehen, und suche Kontakte und Netzwerke dort.",
  },
  {
    id: "D7Q5",
    dimensionId: "D7",
    text: "Eine Gruppe, die auch auf Englisch kommuniziert oder internationale Themen bearbeitet, interessiert mich.",
  },
  {
    id: "D7Q6",
    dimensionId: "D7",
    text: "Ich bin an anderen Kulturen, Traditionen und Perspektiven sehr interessiert.",
  },

  // ── D8: Kompetitivität ─────────────────────────────────────────
  {
    id: "D8Q1",
    dimensionId: "D8",
    text: "Ich schätze Wettbewerbe und Turniere – ob Sport, Hackathon oder Debatte.",
  },
  {
    id: "D8Q2",
    dimensionId: "D8",
    text: "Leistung und messbarer Erfolg motivieren mich stärker als Spaß ohne Ziel.",
  },
  {
    id: "D8Q3",
    dimensionId: "D8",
    text: "Ich möchte in Rankings, Bestenlisten oder Meisterschaften auftreten.",
  },
  {
    id: "D8Q4",
    dimensionId: "D8",
    text: "Ehrgeiz und Zielstrebigkeit sind für mich selbstverständliche Eigenschaften.",
  },
  {
    id: "D8Q5",
    dimensionId: "D8",
    text: "Ich trainiere oder übe gerne hart für ein konkretes, ambitioniertes Ziel.",
  },
  {
    id: "D8Q6",
    dimensionId: "D8",
    text: "Ein kompetitives Umfeld spornt mich an und bringt meine Leistung auf ein höheres Niveau.",
  },

  // ── D9: Digital vs. Analog ────────────────────────────────────
  {
    id: "D9Q1",
    dimensionId: "D9",
    text: "Digitale Tools, Online-Kollaboration und Remote-Arbeit bevorzuge ich gegenüber reinen Präsenztreffen.",
  },
  {
    id: "D9Q2",
    dimensionId: "D9",
    text: "Ich möchte Coding, IT-Technologien oder digitale Systeme in der Gruppe einsetzen.",
  },
  {
    id: "D9Q3",
    dimensionId: "D9",
    text: "Social-Media-Präsenz und digitale Kommunikation interessieren mich als Aufgabenfeld.",
  },
  {
    id: "D9Q4",
    dimensionId: "D9",
    text: "Analoge Aktivitäten – z.B. Basteln, Kochen, Outdoor-Aktionen – ziehe ich digitalen vor.",
  },
  {
    id: "D9Q5",
    dimensionId: "D9",
    text: "Eine physische Gemeinschaft vor Ort ist mir wichtiger als Online-Kontakte und virtuelle Teams.",
  },
  {
    id: "D9Q6",
    dimensionId: "D9",
    text: "Ich kombiniere gerne digitale und analoge Arbeitsweisen und sehe beides als gleichwertig an.",
  },

  // ── D10: Einstiegsfreundlichkeit ──────────────────────────────
  {
    id: "D10Q1",
    dimensionId: "D10",
    text: "Ich bin im ersten Semester und habe noch keine Erfahrung in studentischen Gruppen.",
  },
  {
    id: "D10Q2",
    dimensionId: "D10",
    text: "Ich möchte, dass keine Vorkenntnisse für die Teilnahme notwendig sind.",
  },
  {
    id: "D10Q3",
    dimensionId: "D10",
    text: "Ein strukturiertes Onboarding und eine gute Einführung für Neue sind mir wichtig.",
  },
  {
    id: "D10Q4",
    dimensionId: "D10",
    text: "Ich suche eine Gruppe, die Anfänger aktiv willkommen heißt und begleitet.",
  },
  {
    id: "D10Q5",
    dimensionId: "D10",
    text: "Ich möchte schnell ankommen und nicht lange warten oder mich bewerben müssen.",
  },
  {
    id: "D10Q6",
    dimensionId: "D10",
    text: "Ein niedrigschwelliges erstes Angebot – z.B. ein Schnuppertreffen – ist mir sehr wichtig.",
  },
];

// Helper: get dimension object by id
export function getDimension(id: string): Dimension {
  return DIMENSIONS.find((d) => d.id === id) ?? DIMENSIONS[0];
}

// Helper: get all questions for a dimension
export function getQuestionsForDimension(dimensionId: string): PilotQuestion[] {
  return PILOT_QUESTIONS.filter((q) => q.dimensionId === dimensionId);
}

// Helper: get global question index
export function getQuestionIndex(questionId: string): number {
  return PILOT_QUESTIONS.findIndex((q) => q.id === questionId);
}
