// SPDX-License-Identifier: AGPL-3.0-only

import { PrismaClient, AdminRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Categories ──────────────────────────────────────────────

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Politik & Gesellschaft",
        description:
          "Hochschulgruppen mit politischem oder gesellschaftlichem Fokus",
        color: "#E63946",
        icon: "megaphone",
        order: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: "Sport & Bewegung",
        description: "Sportliche Hochschulgruppen und Teams",
        color: "#00BBF9",
        icon: "trophy",
        order: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: "Kunst & Kultur",
        description: "Kreative und kulturelle Hochschulgruppen",
        color: "#9B5DE5",
        icon: "palette",
        order: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: "Musik",
        description: "Chöre, Bands, Orchester und musikalische Gruppen",
        color: "#F15BB5",
        icon: "music",
        order: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: "Technik & Wissenschaft",
        description:
          "Hochschulgruppen rund um Technik, IT und Forschung",
        color: "#00F5D4",
        icon: "cpu",
        order: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: "Nachhaltigkeit",
        description:
          "Hochschulgruppen für Umweltschutz und nachhaltiges Leben",
        color: "#06D6A0",
        icon: "leaf",
        order: 6,
      },
    }),
    prisma.category.create({
      data: {
        name: "Internationales",
        description:
          "Interkultureller Austausch und internationale Netzwerke",
        color: "#FFD166",
        icon: "globe",
        order: 7,
      },
    }),
    prisma.category.create({
      data: {
        name: "Soziales Engagement",
        description: "Soziales Engagement und Beratungsangebote",
        color: "#EF476F",
        icon: "heart",
        order: 8,
      },
    }),
    prisma.category.create({
      data: {
        name: "Glaube & Spiritualität",
        description: "Religiöse, weltanschauliche und spirituelle Gruppen",
        color: "#B59CE0",
        icon: "sparkles",
        order: 9,
      },
    }),
    prisma.category.create({
      data: {
        name: "Wirtschaft & Karriere",
        description: "Unternehmertum, Consulting und Karriere-Netzwerke",
        color: "#F77F00",
        icon: "briefcase",
        order: 10,
      },
    }),
    prisma.category.create({
      data: {
        name: "Sonstiges",
        description: "Sonstige Hochschulgruppen",
        color: "#8D99AE",
        icon: "more-horizontal",
        order: 11,
      },
    }),
  ]);

  const [politik, sport, kultur, , technik, umwelt, international, soziales] =
    categories;

  // ─── Groups ──────────────────────────────────────────────────

  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: "AEGEE Dresden",
        slug: "aegee-dresden",
        shortDescription:
          "Europäisches Studentennetzwerk für kulturellen Austausch und Reisen",
        longDescription:
          "AEGEE (Association des États Généraux des Étudiants de l'Europe) ist eines der größten interdisziplinären Studierendennetzwerke Europas. Wir organisieren Austauschprogramme, kulturelle Events und setzen uns für ein vereintes Europa ein.",
        categoryId: international.id,
        contactEmail: "aegee-dresden@example.com",
        websiteUrl: "https://aegee-dresden.eu",
        instagramUrl: "https://instagram.com/aegee_dresden",
        memberCount: 45,
        meetingSchedule: "Jeden Dienstag, 19:00 Uhr",
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Robotik AG",
        slug: "robotik-ag",
        shortDescription:
          "Wir bauen Roboter und nehmen an internationalen Wettbewerben teil",
        longDescription:
          "Die Robotik AG der TU Dresden vereint Studierende aus verschiedenen Fachrichtungen, die gemeinsam Roboter entwickeln. Von autonomen Fahrzeugen bis zu Industrierobotern – bei uns wird Theorie zu Praxis.",
        categoryId: technik.id,
        contactEmail: "robotik@example.com",
        websiteUrl: "https://robotik.tu-dresden.de",
        memberCount: 30,
        meetingSchedule: "Mittwoch & Freitag, 16:00 Uhr, Barkhausen-Bau",
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Uni Big Band Dresden",
        slug: "uni-big-band",
        shortDescription:
          "Jazz, Funk und Soul – die Big Band der TU Dresden",
        categoryId: kultur.id,
        contactEmail: "bigband@example.com",
        websiteUrl: "https://unibigband-dresden.de",
        instagramUrl: "https://instagram.com/unibigband_dd",
        memberCount: 25,
        meetingSchedule: "Montag, 19:30 Uhr, Alte Mensa",
        isActive: true,
        isVerified: false,
      },
    }),
    prisma.group.create({
      data: {
        name: "Greenteam",
        slug: "greenteam",
        shortDescription:
          "Nachhaltigkeit auf dem Campus: Foodsharing, Repair Cafés und mehr",
        longDescription:
          "Das Greenteam setzt sich für einen nachhaltigeren Campus ein. Wir organisieren Foodsharing-Aktionen, Kleidertausch, Repair Cafés und Workshops zu Themen wie Zero Waste und Urban Gardening.",
        categoryId: umwelt.id,
        contactEmail: "greenteam@example.com",
        websiteUrl: "https://greenteam-dresden.de",
        instagramUrl: "https://instagram.com/greenteam_tud",
        memberCount: 60,
        meetingSchedule: "Donnerstag, 18:00 Uhr",
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Hochschulgruppe für Debattieren",
        slug: "debattierclub",
        shortDescription:
          "Rhetorisch überzeugen: Wöchentliche Debatten im Parlamentsstil",
        categoryId: politik.id,
        contactEmail: "debattieren@example.com",
        websiteUrl: "https://debattieren-dresden.de",
        memberCount: 20,
        meetingSchedule: "Dienstag, 20:00 Uhr, GER/038",
        isActive: true,
        isVerified: false,
      },
    }),
    prisma.group.create({
      data: {
        name: "Uni-Sportverein Klettern",
        slug: "usv-klettern",
        shortDescription:
          "Bouldern und Klettern für alle Level – von Anfänger bis Wettkampf",
        categoryId: sport.id,
        contactEmail: "klettern@example.com",
        websiteUrl: "https://usv-tu-dresden.de/klettern",
        memberCount: 80,
        meetingSchedule: "Mo/Mi/Fr, 17:00-20:00, Kletterhalle",
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Nightline Dresden",
        slug: "nightline-dresden",
        shortDescription:
          "Anonymes Zuhörtelefon von Studierenden für Studierende",
        categoryId: soziales.id,
        contactEmail: "nightline@example.com",
        websiteUrl: "https://nightline-dresden.de",
        memberCount: 35,
        meetingSchedule: "Schulungen: Sa, 10:00-16:00, alle 2 Wochen",
        isActive: true,
        isVerified: true,
      },
    }),
  ]);

  // ─── Pilot Dimensions & Questions ───────────────────────────

  const pilotDimensions = [
    { id: "D1", label: "Zeitbudget & Verbindlichkeit", emoji: "⏰", description: "Wie viel Zeit und Verbindlichkeit möchtest du einbringen?", blockIndex: 0, order: 1 },
    { id: "D2", label: "Hands-on vs. Theoretisch", emoji: "🔨", description: "Praktisch anpacken oder konzeptionell denken – was liegt dir mehr?", blockIndex: 0, order: 2 },
    { id: "D3", label: "Sozialstil", emoji: "👥", description: "Wie möchtest du mit anderen in der Gruppe interagieren?", blockIndex: 0, order: 3 },
    { id: "D4", label: "Politisches Engagement", emoji: "📢", description: "Wie wichtig ist dir gesellschaftliches oder politisches Engagement?", blockIndex: 1, order: 4 },
    { id: "D5", label: "Kreativität", emoji: "🎨", description: "Spielen kreative Projekte und künstlerischer Ausdruck eine Rolle?", blockIndex: 1, order: 5 },
    { id: "D6", label: "Werte & Weltanschauung", emoji: "🌱", description: "Sollen gemeinsame Werte oder eine Weltanschauung die Gruppe prägen?", blockIndex: 2, order: 6 },
    { id: "D7", label: "Internationalität", emoji: "🌍", description: "Wie wichtig ist dir internationaler Austausch und Diversität?", blockIndex: 2, order: 7 },
    { id: "D8", label: "Kompetitivität", emoji: "🏆", description: "Motivieren dich Wettbewerbe, Ranglistenplätze und messbare Leistung?", blockIndex: 2, order: 8 },
    { id: "D9", label: "Digital vs. Analog", emoji: "💻", description: "Arbeitest du lieber mit digitalen Tools oder analog vor Ort?", blockIndex: 3, order: 9 },
    { id: "D10", label: "Einstiegsfreundlichkeit", emoji: "🚀", description: "Wie wichtig ist dir ein niedrigschwelliger, anfängerfreundlicher Einstieg?", blockIndex: 3, order: 10 },
  ];

  for (const dim of pilotDimensions) {
    await prisma.pilotDimension.create({ data: dim });
  }

  const pilotQuestions = [
    { id: "D1Q1", dimensionId: "D1", text: "Ich kann mir vorstellen, mehr als 5 Stunden pro Woche für eine Hochschulgruppe aufzuwenden.", order: 1 },
    { id: "D1Q2", dimensionId: "D1", text: "Ich möchte mich langfristig (mindestens 2 Semester) in einer Gruppe engagieren.", order: 2 },
    { id: "D1Q3", dimensionId: "D1", text: "Feste, regelmäßige Treffen (z.B. wöchentlich) sind mir wichtig.", order: 3 },
    { id: "D1Q4", dimensionId: "D1", text: "Klare Erwartungen und Verbindlichkeiten in einer Gruppe schätze ich sehr.", order: 4 },
    { id: "D1Q5", dimensionId: "D1", text: "Ich möchte in einer Gruppe Verantwortung übernehmen, z.B. als Projektleiterin oder im Vorstand.", order: 5 },
    { id: "D1Q6", dimensionId: "D1", text: "Ein intensives, verbindliches Engagement ist mir lieber als eine lockere Mitgliedschaft.", order: 6 },
    { id: "D2Q1", dimensionId: "D2", text: "Ich lerne lieber durch praktisches Tun als durch Theorie und Diskussion.", order: 1 },
    { id: "D2Q2", dimensionId: "D2", text: "Projekte mit einem konkreten, sichtbaren Ergebnis motivieren mich besonders.", order: 2 },
    { id: "D2Q3", dimensionId: "D2", text: "Ich bin gerne im Labor, in der Werkstatt oder direkt im Feld aktiv.", order: 3 },
    { id: "D2Q4", dimensionId: "D2", text: "Ich möchte handwerkliche, technische oder gestalterische Fähigkeiten in der Gruppe einsetzen.", order: 4 },
    { id: "D2Q5", dimensionId: "D2", text: "Strategische Planung und konzeptionelle Arbeit machen mir genauso viel Spaß wie die Umsetzung.", order: 5 },
    { id: "D2Q6", dimensionId: "D2", text: "Theorie, Debatten und intellektuelle Auseinandersetzung sind mir genauso wichtig wie die Praxis.", order: 6 },
    { id: "D3Q1", dimensionId: "D3", text: "Ich suche eine Hochschulgruppe vor allem, um neue Freundschaften zu schließen.", order: 1 },
    { id: "D3Q2", dimensionId: "D3", text: "Networking und der Aufbau beruflicher Kontakte sind mir in einer Gruppe wichtig.", order: 2 },
    { id: "D3Q3", dimensionId: "D3", text: "Ich bevorzuge kleine, überschaubare Gruppen mit weniger als 20 aktiven Mitgliedern.", order: 3 },
    { id: "D3Q4", dimensionId: "D3", text: "Ich fühle mich in großen, lebhaften Gruppen mit vielen verschiedenen Menschen wohl.", order: 4 },
    { id: "D3Q5", dimensionId: "D3", text: "Gemeinsame Feiern, Ausflüge und Socializing-Events sind für mich ein wichtiger Teil einer Gruppe.", order: 5 },
    { id: "D3Q6", dimensionId: "D3", text: "Intensive Zusammenarbeit in einem kleinen, eng vernetzten Team motiviert mich am meisten.", order: 6 },
    { id: "D4Q1", dimensionId: "D4", text: "Ich möchte gesellschaftlichen Wandel aktiv mitgestalten.", order: 1 },
    { id: "D4Q2", dimensionId: "D4", text: "Politisches oder soziales Engagement ist ein wichtiger Teil meines Studiums für mich.", order: 2 },
    { id: "D4Q3", dimensionId: "D4", text: "Ich interessiere mich für Hochschulpolitik und studentische Mitbestimmung.", order: 3 },
    { id: "D4Q4", dimensionId: "D4", text: "Ich möchte mich für benachteiligte oder marginalisierte Gruppen einsetzen.", order: 4 },
    { id: "D4Q5", dimensionId: "D4", text: "Umweltschutz und Klimagerechtigkeit sind für mich zentrale Themen.", order: 5 },
    { id: "D4Q6", dimensionId: "D4", text: "Ich bevorzuge eine Gruppe ohne expliziten politischen oder gesellschaftlichen Anspruch.", order: 6, isInverse: true },
    { id: "D5Q1", dimensionId: "D5", text: "Kreatives Gestalten – z.B. Schreiben, Zeichnen, Fotografieren oder Musik – liegt mir sehr am Herzen.", order: 1 },
    { id: "D5Q2", dimensionId: "D5", text: "Ich möchte in einer Gruppe eigene künstlerische Projekte realisieren.", order: 2 },
    { id: "D5Q3", dimensionId: "D5", text: "Kulturelle Veranstaltungen zu organisieren oder mitzugestalten macht mir Spaß.", order: 3 },
    { id: "D5Q4", dimensionId: "D5", text: "Improvisation und kreative Freiheit schätze ich mehr als starre Strukturen.", order: 4 },
    { id: "D5Q5", dimensionId: "D5", text: "Ich möchte meine kreativen Fähigkeiten aktiv in einer Hochschulgruppe einbringen.", order: 5 },
    { id: "D5Q6", dimensionId: "D5", text: "Ästhetik, Design und visuelle Gestaltung spielen in meiner Arbeit eine wichtige Rolle.", order: 6 },
    { id: "D6Q1", dimensionId: "D6", text: "Mein Glaube oder meine Weltanschauung soll in der Gruppe eine sichtbare Rolle spielen.", order: 1 },
    { id: "D6Q2", dimensionId: "D6", text: "Ethische Prinzipien und Wertfragen leiten meine Entscheidungen stark.", order: 2 },
    { id: "D6Q3", dimensionId: "D6", text: "Nachhaltigkeit und ökologisches Handeln sind für mich unverzichtbare Gruppenmerkmale.", order: 3 },
    { id: "D6Q4", dimensionId: "D6", text: "Ich suche eine Gemeinschaft, die geteilte Werte und eine gemeinsame Identität hat.", order: 4 },
    { id: "D6Q5", dimensionId: "D6", text: "Spirituelle oder philosophische Fragen beschäftigen mich und sollen Raum in der Gruppe haben.", order: 5 },
    { id: "D6Q6", dimensionId: "D6", text: "Mir ist wichtig, mit Menschen zusammenzukommen, die ähnlich denken und ähnliche Überzeugungen teilen.", order: 6 },
    { id: "D7Q1", dimensionId: "D7", text: "Ich möchte in der Gruppe internationale Studierende kennenlernen.", order: 1 },
    { id: "D7Q2", dimensionId: "D7", text: "Ich setze gerne meine Fremdsprachenkenntnisse in einer Hochschulgruppe ein.", order: 2 },
    { id: "D7Q3", dimensionId: "D7", text: "Interkultureller Austausch ist für mich ein wesentlicher Mehrwert einer Gruppe.", order: 3 },
    { id: "D7Q4", dimensionId: "D7", text: "Ich plane, ins Ausland zu gehen, und suche Kontakte und Netzwerke dort.", order: 4 },
    { id: "D7Q5", dimensionId: "D7", text: "Eine Gruppe, die auch auf Englisch kommuniziert oder internationale Themen bearbeitet, interessiert mich.", order: 5 },
    { id: "D7Q6", dimensionId: "D7", text: "Ich bin an anderen Kulturen, Traditionen und Perspektiven sehr interessiert.", order: 6 },
    { id: "D8Q1", dimensionId: "D8", text: "Ich schätze Wettbewerbe und Turniere – ob Sport, Hackathon oder Debatte.", order: 1 },
    { id: "D8Q2", dimensionId: "D8", text: "Leistung und messbarer Erfolg motivieren mich stärker als Spaß ohne Ziel.", order: 2 },
    { id: "D8Q3", dimensionId: "D8", text: "Ich möchte in Rankings, Bestenlisten oder Meisterschaften auftreten.", order: 3 },
    { id: "D8Q4", dimensionId: "D8", text: "Ehrgeiz und Zielstrebigkeit sind für mich selbstverständliche Eigenschaften.", order: 4 },
    { id: "D8Q5", dimensionId: "D8", text: "Ich trainiere oder übe gerne hart für ein konkretes, ambitioniertes Ziel.", order: 5 },
    { id: "D8Q6", dimensionId: "D8", text: "Ein kompetitives Umfeld spornt mich an und bringt meine Leistung auf ein höheres Niveau.", order: 6 },
    { id: "D9Q1", dimensionId: "D9", text: "Digitale Tools, Online-Kollaboration und Remote-Arbeit bevorzuge ich gegenüber reinen Präsenztreffen.", order: 1 },
    { id: "D9Q2", dimensionId: "D9", text: "Ich möchte Coding, IT-Technologien oder digitale Systeme in der Gruppe einsetzen.", order: 2 },
    { id: "D9Q3", dimensionId: "D9", text: "Social-Media-Präsenz und digitale Kommunikation interessieren mich als Aufgabenfeld.", order: 3 },
    { id: "D9Q4", dimensionId: "D9", text: "Analoge Aktivitäten – z.B. Basteln, Kochen, Outdoor-Aktionen – ziehe ich digitalen vor.", order: 4, isInverse: true },
    { id: "D9Q5", dimensionId: "D9", text: "Eine physische Gemeinschaft vor Ort ist mir wichtiger als Online-Kontakte und virtuelle Teams.", order: 5, isInverse: true },
    { id: "D9Q6", dimensionId: "D9", text: "Ich kombiniere gerne digitale und analoge Arbeitsweisen und sehe beides als gleichwertig an.", order: 6 },
    { id: "D10Q1", dimensionId: "D10", text: "Ich bin im ersten Semester und habe noch keine Erfahrung in studentischen Gruppen.", order: 1 },
    { id: "D10Q2", dimensionId: "D10", text: "Ich möchte, dass keine Vorkenntnisse für die Teilnahme notwendig sind.", order: 2 },
    { id: "D10Q3", dimensionId: "D10", text: "Ein strukturiertes Onboarding und eine gute Einführung für Neue sind mir wichtig.", order: 3 },
    { id: "D10Q4", dimensionId: "D10", text: "Ich suche eine Gruppe, die Anfänger aktiv willkommen heißt und begleitet.", order: 4 },
    { id: "D10Q5", dimensionId: "D10", text: "Ich möchte schnell ankommen und nicht lange warten oder mich bewerben müssen.", order: 5 },
    { id: "D10Q6", dimensionId: "D10", text: "Ein niedrigschwelliges erstes Angebot – z.B. ein Schnuppertreffen – ist mir sehr wichtig.", order: 6 },
  ];

  for (const q of pilotQuestions) {
    await prisma.pilotSurveyQuestion.create({ data: q });
  }

  // ─── Admin User ──────────────────────────────────────────────

  // WARNING: Development-only credentials. Change in production!
  const DEV_ADMIN_PASSWORD = "fomo-dev-2026!";
  const hashedPassword = await hash(DEV_ADMIN_PASSWORD, 12);

  await prisma.admin.create({
    data: {
      email: "admin@fomo.dev",
      name: "FOMO Admin",
      passwordHash: hashedPassword,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Seed complete!");
  console.log("   → 7 categories");
  console.log("   → 7 groups");
  console.log("   → 10 pilot dimensions + 60 pilot questions");
  console.log(`   → 1 admin user (admin@fomo.dev / ${DEV_ADMIN_PASSWORD})`);
  console.log("   ⚠️  Change admin password before deploying to production!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
