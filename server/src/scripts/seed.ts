import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { LEAGUE_REGISTRY } from "../config/leagues.js";
import { getCurrentSeasonYears, formatSeasonName } from "../config/seasons.js";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("Seeding leagues...");

  for (const league of LEAGUE_REGISTRY) {
    const slug = slugify(league.name);
    await prisma.league.upsert({
      where: { slug },
      update: {},
      create: {
        name: league.name,
        country: league.country,
        confederation: league.confederation,
        tier: league.tier,
        slug,
        wikipediaPage: league.wikipediaPage,
        scraperType: league.scraperType,
      },
    });
    console.log(`  ✓ ${league.name}`);
  }

  const { startYear, endYear } = getCurrentSeasonYears();
  const seasonName = formatSeasonName(startYear, endYear);

  console.log(`\nCreating current season (${seasonName})...`);

  const leagues = await prisma.league.findMany();
  for (const league of leagues) {
    await prisma.season.upsert({
      where: { leagueId_name: { leagueId: league.id, name: seasonName } },
      update: {},
      create: {
        leagueId: league.id,
        name: seasonName,
        startYear,
        endYear,
        wikipediaPage: `${startYear}–${endYear} ${league.wikipediaPage}`,
      },
    });
  }

  console.log("✓ Seasons created");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
