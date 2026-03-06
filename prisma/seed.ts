// SPDX-License-Identifier: AGPL-3.0-only

import { PrismaClient, QuestionType, AdminRole } from "@prisma/client";
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
        name: "Kultur & Kunst",
        description: "Kreative und kulturelle Hochschulgruppen",
        color: "#9B5DE5",
        icon: "palette",
        order: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: "Sport & Bewegung",
        description: "Sportliche Hochschulgruppen und Teams",
        color: "#00BBF9",
        icon: "trophy",
        order: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: "Technik & Wissenschaft",
        description:
          "Hochschulgruppen rund um Technik, IT und Forschung",
        color: "#00F5D4",
        icon: "cpu",
        order: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: "Umwelt & Nachhaltigkeit",
        description:
          "Hochschulgruppen für Umweltschutz und nachhaltiges Leben",
        color: "#06D6A0",
        icon: "leaf",
        order: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: "International & Sprachen",
        description:
          "Interkultureller Austausch und internationale Netzwerke",
        color: "#FFD166",
        icon: "globe",
        order: 6,
      },
    }),
    prisma.category.create({
      data: {
        name: "Soziales & Beratung",
        description: "Soziales Engagement und Beratungsangebote",
        color: "#EF476F",
        icon: "heart",
        order: 7,
      },
    }),
  ]);

  const [politik, kultur, sport, technik, umwelt, international, soziales] =
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

  // ─── Questions ───────────────────────────────────────────────

  const questions = await Promise.all([
    // Q1: SLIDER – Zeitbudget
    prisma.question.create({
      data: {
        text: "Wie viele Stunden pro Woche könntest du dir für eine Hochschulgruppe vorstellen?",
        type: QuestionType.SLIDER,
        order: 1,
        helpText: "Denk realistisch – auch 1-2 Stunden sind völlig okay!",
        categoryTag: "time",
        weight: 1.0,
        sliderMin: 1,
        sliderMax: 10,
        sliderStep: 1,
        sliderMinLabel: "1 Stunde",
        sliderMaxLabel: "10+ Stunden",
      },
    }),
    // Q2: LIKERT – Hands-on vs. Theorie
    prisma.question.create({
      data: {
        text: "Was reizt dich mehr: praktisch anpacken oder über Ideen diskutieren?",
        type: QuestionType.LIKERT,
        order: 2,
        helpText: "1 = Ich will mit den Händen arbeiten, 5 = Ich liebe Diskussionen",
        categoryTag: "style",
        weight: 1.2,
      },
    }),
    // Q3: LIKERT – Team vs. Solo
    prisma.question.create({
      data: {
        text: "Arbeitest du lieber im Team oder eigenständig?",
        type: QuestionType.LIKERT,
        order: 3,
        helpText: "1 = Am liebsten allein, 5 = Teamwork macht's für mich aus",
        categoryTag: "social",
        weight: 1.0,
      },
    }),
    // Q4: LIKERT – Politisches Engagement
    prisma.question.create({
      data: {
        text: "Wie wichtig ist dir, dass dein Engagement einen politischen Impact hat?",
        type: QuestionType.LIKERT,
        order: 4,
        categoryTag: "politics",
        weight: 1.5,
      },
    }),
    // Q5: MULTI_CHOICE – Themen-Interessen
    prisma.question.create({
      data: {
        text: "Welche Themen interessieren dich? (Wähle alle, die passen)",
        type: QuestionType.MULTI_CHOICE,
        order: 5,
        categoryTag: "interests",
        weight: 2.0,
        options: {
          create: [
            { label: "Technik & Programmieren", value: "tech", order: 1 },
            { label: "Musik & Kunst", value: "culture", order: 2 },
            { label: "Sport & Fitness", value: "sport", order: 3 },
            { label: "Politik & Gesellschaft", value: "politics", order: 4 },
            { label: "Umwelt & Nachhaltigkeit", value: "environment", order: 5 },
            { label: "Sprachen & Reisen", value: "international", order: 6 },
            { label: "Soziales Engagement", value: "social", order: 7 },
          ],
        },
      },
    }),
    // Q6: LIKERT – Lernmotivation
    prisma.question.create({
      data: {
        text: "Möchtest du etwas komplett Neues lernen oder vorhandene Skills einbringen?",
        type: QuestionType.LIKERT,
        order: 6,
        helpText: "1 = Neues lernen, 5 = Meine Stärken einsetzen",
        categoryTag: "motivation",
        weight: 0.8,
      },
    }),
    // Q7: LIKERT – Nachhaltigkeit
    prisma.question.create({
      data: {
        text: "Wie wichtig ist dir Nachhaltigkeit und Umweltschutz?",
        type: QuestionType.LIKERT,
        order: 7,
        categoryTag: "values",
        weight: 1.3,
      },
    }),
    // Q8: YES_NO – Wettkämpfe
    prisma.question.create({
      data: {
        text: "Hast du Lust auf Wettkämpfe und Wettbewerbe?",
        type: QuestionType.YES_NO,
        order: 8,
        categoryTag: "competition",
        weight: 1.0,
      },
    }),
    // Q9: LIKERT – Internationalität
    prisma.question.create({
      data: {
        text: "Möchtest du internationale Kontakte knüpfen?",
        type: QuestionType.LIKERT,
        order: 9,
        categoryTag: "international",
        weight: 1.2,
      },
    }),
    // Q10: SINGLE_CHOICE – Abend-Szenario
    prisma.question.create({
      data: {
        text: "Was klingt nach einem guten Mittwochabend für dich?",
        type: QuestionType.SINGLE_CHOICE,
        order: 10,
        categoryTag: "lifestyle",
        weight: 1.0,
        options: {
          create: [
            { label: "Probe im Bandraum oder Atelier", value: "creative", order: 1 },
            { label: "Sporthalle oder Kletterwand", value: "active", order: 2 },
            { label: "Podiumsdiskussion oder Stammtisch", value: "debate", order: 3 },
            { label: "Hackathon oder Werkstatt", value: "tech", order: 4 },
            { label: "Filmabend oder Spieleabend", value: "chill", order: 5 },
          ],
        },
      },
    }),
  ]);

  // ─── Group Profiles (sample, for seed groups × seed questions) ─

  // Helper: create profile entries for a group
  async function createProfiles(
    groupId: string,
    answers: Record<number, string>
  ) {
    for (const [qIndex, value] of Object.entries(answers)) {
      const question = questions[Number(qIndex)];
      if (question) {
        await prisma.groupProfile.create({
          data: {
            groupId,
            questionId: question.id,
            answerValue: value,
          },
        });
      }
    }
  }

  // AEGEE: international, social, moderate time, creative
  await createProfiles(groups[0].id, {
    0: "4",      // 4h/week
    1: "3",      // balanced
    2: "5",      // very team-oriented
    3: "2",      // low political focus
    4: "international,culture", // interests
    5: "2",      // learn new things
    6: "3",      // moderate sustainability
    7: "0",      // no competitions
    8: "5",      // very international
    9: "chill",  // evening activity
  });

  // Robotik AG: technical, hands-on, competitive
  await createProfiles(groups[1].id, {
    0: "6",       // 6h/week
    1: "1",       // very hands-on
    2: "4",       // team-oriented
    3: "1",       // not political
    4: "tech",    // tech interest
    5: "4",       // use existing skills
    6: "2",       // low sustainability focus
    7: "1",       // yes competitions
    8: "3",       // moderate international
    9: "tech",    // hackathon evening
  });

  // Big Band: creative, team, moderate time
  await createProfiles(groups[2].id, {
    0: "3",         // 3h/week
    1: "1",         // practical (playing music)
    2: "5",         // very team-oriented
    3: "1",         // not political
    4: "culture",   // culture interest
    5: "3",         // balanced
    6: "2",         // low sustainability
    7: "1",         // yes (concerts = performances)
    8: "2",         // low international
    9: "creative",  // creative evening
  });

  // Greenteam: sustainability, social, hands-on
  await createProfiles(groups[3].id, {
    0: "3",                    // 3h/week
    1: "2",                    // more hands-on
    2: "4",                    // team-oriented
    3: "3",                    // moderate political
    4: "environment,social",   // interests
    5: "2",                    // learn new things
    6: "5",                    // very sustainability-focused
    7: "0",                    // no competitions
    8: "2",                    // low international
    9: "chill",                // relaxed evening
  });

  // Debattierclub: theoretical, political, competitive
  await createProfiles(groups[4].id, {
    0: "3",        // 3h/week
    1: "5",        // loves discussion
    2: "4",        // team (debate format)
    3: "5",        // very political
    4: "politics", // political interest
    5: "2",        // learn rhetoric
    6: "3",        // moderate sustainability
    7: "1",        // yes competitions (debate tournaments)
    8: "3",        // moderate international
    9: "debate",   // discussion evening
  });

  // Klettern: sport, competitive, independent
  await createProfiles(groups[5].id, {
    0: "5",      // 5h/week
    1: "1",      // very practical
    2: "3",      // balanced (solo + team)
    3: "1",      // not political
    4: "sport",  // sport interest
    5: "2",      // learn climbing
    6: "2",      // low sustainability
    7: "1",      // yes competitions
    8: "2",      // low international
    9: "active", // active evening
  });

  // Nightline: social, empathetic, low time commitment
  await createProfiles(groups[6].id, {
    0: "2",      // 2h/week
    1: "4",      // more discussion/listening
    2: "3",      // balanced
    3: "2",      // low political
    4: "social", // social interest
    5: "1",      // learn new skills (active listening)
    6: "3",      // moderate sustainability
    7: "0",      // no competitions
    8: "2",      // low international
    9: "chill",  // calm evening
  });

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
  console.log("   → 7 groups with profiles");
  console.log("   → 10 questions");
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
