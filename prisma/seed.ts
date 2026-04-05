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

  await Promise.all([
    prisma.group.create({
      data: {
        name: "AEGEE Dresden",
        slug: "aegee-dresden",
        shortDescription:
          "Europäisches Studentennetzwerk für kulturellen Austausch und Reisen",
        categoryId: international.id,
        isActive: true,
        isVerified: true,
        international: true,
        networking: true,
        party: true,
        beginnerFriendly: true,
        timeLow: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Robotik AG",
        slug: "robotik-ag",
        shortDescription:
          "Wir bauen Roboter und nehmen an internationalen Wettbewerben teil",
        categoryId: technik.id,
        isActive: true,
        isVerified: true,
        tech: true,
        handsOn: true,
        competitive: true,
        career: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Uni Big Band Dresden",
        slug: "uni-big-band",
        shortDescription:
          "Jazz, Funk und Soul – die Big Band der TU Dresden",
        categoryId: kultur.id,
        isActive: true,
        music: true,
        arts: true,
        beginnerFriendly: false,
      },
    }),
    prisma.group.create({
      data: {
        name: "Greenteam",
        slug: "greenteam",
        shortDescription:
          "Nachhaltigkeit auf dem Campus: Foodsharing, Repair Cafés und mehr",
        categoryId: umwelt.id,
        isActive: true,
        isVerified: true,
        socialImpact: true,
        handsOn: true,
        outdoor: true,
        beginnerFriendly: true,
        timeLow: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Hochschulgruppe für Debattieren",
        slug: "debattierclub",
        shortDescription:
          "Rhetorisch überzeugen: Wöchentliche Debatten im Parlamentsstil",
        categoryId: politik.id,
        isActive: true,
        socialImpact: true,
        networking: true,
        competitive: true,
        leadershipOpportunities: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Uni-Sportverein Klettern",
        slug: "usv-klettern",
        shortDescription:
          "Bouldern und Klettern für alle Level – von Anfänger bis Wettkampf",
        categoryId: sport.id,
        isActive: true,
        isVerified: true,
        sports: true,
        outdoor: true,
        competitive: true,
        beginnerFriendly: true,
        financialCost: true,
      },
    }),
    prisma.group.create({
      data: {
        name: "Nightline Dresden",
        slug: "nightline-dresden",
        shortDescription:
          "Anonymes Zuhörtelefon von Studierenden für Studierende",
        categoryId: soziales.id,
        isActive: true,
        isVerified: true,
        socialImpact: true,
        beginnerFriendly: true,
        timeLow: true,
      },
    }),
  ]);

  // ─── Admin User ──────────────────────────────────────────────

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
  console.log(`   → 1 admin user (admin@fomo.dev / ${DEV_ADMIN_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
