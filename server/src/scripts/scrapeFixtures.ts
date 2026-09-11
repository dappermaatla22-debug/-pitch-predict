import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { LEAGUE_REGISTRY } from "../config/leagues.js";
import { scrapeSeason } from "../services/scraper/wikipedia.js";

function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 7) {
    return `${year}\u2013${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}\u2013${year.toString().slice(-2)}`;
  }
}

async function main() {
  const targetSeason = process.argv[2] || getCurrentSeason();

  console.log(`=== Wikipedia Fixture Scraper (Season: ${targetSeason}) ===\n`);

  // Parse both full and short year formats
  const parts = targetSeason.split("–");
  const startYear = parseInt(parts[0], 10);
  const endYearStr = parts[1];
  const endYear = endYearStr.length === 2 ? startYear + 1 : parseInt(endYearStr, 10);

  const leagues = await prisma.league.findMany({
    where: { active: true },
  });

  for (const league of leagues) {
    const config = LEAGUE_REGISTRY.find((c) => c.name === league.name);
    if (!config) continue;

    // Find or create season
    const seasonName = `${startYear}–${endYear}`;
    let season = await prisma.season.findUnique({
      where: { leagueId_name: { leagueId: league.id, name: seasonName } },
    });

    if (!season) {
      season = await prisma.season.create({
        data: {
          leagueId: league.id,
          name: seasonName,
          startYear,
          endYear,
          wikipediaPage: `${targetSeason} ${config.wikipediaPage}`,
        },
      });
      console.log(`Created season: ${seasonName} for ${league.name}`);
    }

    const wikiPage = `${targetSeason} ${config.wikipediaPage}`;

    await scrapeSeason(
      league.id,
      season.id,
      wikiPage,
      config.scraperType,
      config.subpages,
    );
  }

  console.log("\n=== Scraping Complete ===");

  // Show summary
  const stats = await prisma.league.findMany({
    include: {
      _count: { select: { fixtures: true } },
      seasons: {
        select: { name: true, fixtureCount: true, resultCount: true, lastScraped: true },
      },
    },
    orderBy: { name: "asc" },
  });

  console.log("\nFixture counts:");
  for (const l of stats) {
    const season = l.seasons.find((s) => s.name === targetSeason);
    if (season) {
      console.log(
        `  ${l.name}: ${season.fixtureCount} fixtures, ${season.resultCount} results` +
        ` (last scraped: ${season.lastScraped?.toISOString() || "never"})`,
      );
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
