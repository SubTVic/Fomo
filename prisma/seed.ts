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
  console.log(`   → ${categories.length} categories`);
  console.log(`   → ${groups.length} groups`);
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
