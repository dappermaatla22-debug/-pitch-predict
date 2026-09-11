import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { LEAGUE_REGISTRY } from "../config/leagues.js";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Re-matching teams to leagues ===\n");

  const existingLeagues = await prisma.league.findMany();
  const leagueByName = new Map(existingLeagues.map((l) => [l.name.toLowerCase(), l]));

  const countryToLeague: Record<string, string> = {
    "england": "Premier League",
    "spain": "La Liga",
    "italy": "Serie A",
    "germany": "Bundesliga",
    "france": "Ligue 1",
    "netherlands": "Eredivisie",
    "portugal": "Primeira Liga",
    "scotland": "Scottish Premiership",
  };

  let totalMatched = 0;

  for (const [country, leagueName] of Object.entries(countryToLeague)) {
    const league = leagueByName.get(leagueName.toLowerCase());
    if (!league) continue;

    // Use raw SQL for case-insensitive match since SQLite doesn't support mode in Prisma
    const result = await prisma.$executeRawUnsafe(
      `UPDATE Team SET leagueId = ? WHERE leagueId IS NULL AND LOWER(country) = LOWER(?)`,
      league.id,
      country,
    );
    totalMatched += result;
    if (result > 0) {
      console.log(`  ${country} → ${leagueName}: ${result} teams`);
    }
  }

  console.log(`\nTotal matched: ${totalMatched}`);

  // Show final counts
  const leagues = await prisma.league.findMany({
    include: { _count: { select: { teams: true } } },
    orderBy: { name: "asc" },
  });
  console.log("\nFinal team counts per league:");
  for (const l of leagues) {
    console.log(`  ${l.name}: ${l._count.teams}`);
  }

  const total = await prisma.team.count();
  const withLeague = await prisma.team.count({ where: { leagueId: { not: null } } });
  console.log(`\nTotal teams: ${total}, with league: ${withLeague}, without: ${total - withLeague}`);

  await prisma.$disconnect();
}

main();
