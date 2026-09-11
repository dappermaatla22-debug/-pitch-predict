import "dotenv/config";
import { prisma } from "../lib/prisma.js";

function generateRoundRobin(teams: number[]): { home: number; away: number; matchday: number }[] {
  const n = teams.length;
  const isOdd = n % 2 !== 0;
  const list = isOdd ? [...teams, -1] : [...teams];
  const half = list.length / 2;
  const rounds: { home: number; away: number; matchday: number }[] = [];

  for (let round = 0; round < list.length - 1; round++) {
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[list.length - 1 - i];
      if (home === -1 || away === -1) continue;
      rounds.push({ home, away, matchday: round + 1 });
    }
    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  const secondHalf = rounds.map((r) => ({
    home: r.away,
    away: r.home,
    matchday: r.matchday + (list.length - 1),
  }));

  return [...rounds, ...secondHalf];
}

function getNextSaturday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(15, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("=== Generate Upcoming Fixtures ===\n");

  const seasons = await prisma.season.findMany({
    where: { name: "2026\u20132027" },
    include: {
      league: true,
      fixtures: {
        select: { homeTeamId: true, awayTeamId: true, matchday: true, status: true },
      },
    },
  });

  console.log(`Found ${seasons.length} 2026-27 seasons\n`);

  let totalCreated = 0;

  for (const season of seasons) {
    const existingFixtures = season.fixtures;
    if (existingFixtures.length === 0) {
      console.log(`  ${season.league.name}: No existing fixtures, skipping`);
      continue;
    }

    const teamIds = [...new Set([
      ...existingFixtures.map((f) => f.homeTeamId),
      ...existingFixtures.map((f) => f.awayTeamId),
    ])].sort((a, b) => a - b);

    const existingKeys = new Set(
      existingFixtures.map((f) => `${f.homeTeamId}-${f.awayTeamId}`),
    );

    const allFixtures = generateRoundRobin(teamIds);
    const newFixtures = allFixtures.filter(
      (f) => !existingKeys.has(`${f.home}-${f.away}`),
    );

    if (newFixtures.length === 0) {
      console.log(`  ${season.league.name}: All fixtures already exist (${existingFixtures.length})`);
      continue;
    }

    const matchdayGroups = new Map<number, typeof newFixtures>();
    for (const f of newFixtures) {
      const md = f.matchday;
      if (!matchdayGroups.has(md)) matchdayGroups.set(md, []);
      matchdayGroups.get(md)!.push(f);
    }

    const sortedMatchdays = [...matchdayGroups.keys()].sort((a, b) => a - b);
    let currentDate = getNextSaturday(new Date());

    const fixturesToCreate: any[] = [];

    for (const md of sortedMatchdays) {
      const fixtures = matchdayGroups.get(md)!;
      const isMidweek = md % 3 === 0;
      const matchDate = isMidweek ? addDays(currentDate, -3) : currentDate;

      for (const f of fixtures) {
        fixturesToCreate.push({
          seasonId: season.id,
          leagueId: season.leagueId,
          homeTeamId: f.home,
          awayTeamId: f.away,
          matchday: md,
          date: matchDate,
          status: "upcoming",
          homeScore: null,
          awayScore: null,
        });
      }

      currentDate = addDays(currentDate, 7);
    }

    // Batch insert in chunks of 100
    const BATCH_SIZE = 100;
    let created = 0;
    for (let i = 0; i < fixturesToCreate.length; i += BATCH_SIZE) {
      const batch = fixturesToCreate.slice(i, i + BATCH_SIZE);
      try {
        const result = await prisma.fixture.createMany({ data: batch, skipDuplicates: true });
        created += result.count;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`    Batch error: ${msg}`);
      }
    }

    console.log(`  ${season.league.name}: Created ${created} upcoming fixtures (${teamIds.length} teams, ${existingFixtures.length} existing)`);
    totalCreated += created;
  }

  console.log(`\n=== Done: ${totalCreated} upcoming fixtures created ===`);

  const upcoming = await prisma.fixture.count({ where: { status: "upcoming" } });
  const finished = await prisma.fixture.count({ where: { status: "finished" } });
  console.log(`\nDatabase: ${finished} finished, ${upcoming} upcoming`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
