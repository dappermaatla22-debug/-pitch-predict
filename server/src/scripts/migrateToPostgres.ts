import { PrismaClient } from "@prisma/client";
import { DatabaseSync } from "node:sqlite";
import path from "path";

const SQLITE_PATH = path.join(process.cwd(), "prisma", "pitch-predict.db");
const sqlite = new DatabaseSync(SQLITE_PATH);
const pg = new PrismaClient();

function getAll(table: string): Record<string, unknown>[] {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
}

function toBool(v: unknown): boolean {
  return v === 1 || v === true;
}

function toEpochMs(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") return new Date(v);
  return null;
}

async function migrate() {
  console.log("Migration: SQLite → Supabase PostgreSQL\n");

  const leagues = getAll("League");
  const teams = getAll("Team");
  const seasons = getAll("Season");
  const fixtures = getAll("Fixture");
  const predictions = getAll("Prediction");

  console.log(`Source: ${leagues.length} leagues, ${teams.length} teams, ${seasons.length} seasons`);
  console.log(`Source: ${fixtures.length} fixtures, ${predictions.length} predictions\n`);

  // Clear in FK order
  console.log("Clearing PostgreSQL...");
  await pg.prediction.deleteMany();
  await pg.fixture.deleteMany();
  await pg.season.deleteMany();
  await pg.team.deleteMany();
  await pg.league.deleteMany();
  console.log("  Done\n");

  // Batch insert Leagues
  console.log("Inserting Leagues...");
  await pg.league.createMany({
    data: leagues.map((r) => ({
      id: r.id as number,
      wikidataId: r.wikidataId as string | null,
      name: r.name as string,
      country: r.country as string,
      confederation: r.confederation as string,
      tier: r.tier as number,
      slug: r.slug as string,
      logoUrl: r.logoUrl as string | null,
      wikipediaPage: r.wikipediaPage as string | null,
      scraperType: r.scraperType as string,
      active: toBool(r.active),
      createdAt: toEpochMs(r.createdAt) ?? new Date(),
      updatedAt: toEpochMs(r.updatedAt) ?? new Date(),
    })),
  });
  console.log(`  ✓ ${leagues.length} leagues`);

  // Batch insert Teams (1000 at a time)
  console.log("Inserting Teams...");
  for (let i = 0; i < teams.length; i += 1000) {
    const batch = teams.slice(i, i + 1000);
    await pg.team.createMany({
      data: batch.map((r) => ({
        id: r.id as number,
        wikidataId: r.wikidataId as string | null,
        name: r.name as string,
        shortName: r.shortName as string | null,
        slug: r.slug as string,
        country: r.country as string,
        logoUrl: r.logoUrl as string | null,
        founded: r.founded as number | null,
        leagueId: r.leagueId as number | null,
        wikipediaName: r.wikipediaName as string | null,
        aliases: r.aliases as string | null,
        attackRating: r.attackRating as number,
        defenseRating: r.defenseRating as number,
        homeAdvantage: r.homeAdvantage as number,
        lastRatedAt: toEpochMs(r.lastRatedAt),
        createdAt: toEpochMs(r.createdAt) ?? new Date(),
        updatedAt: toEpochMs(r.updatedAt) ?? new Date(),
      })),
    });
    console.log(`  ✓ ${Math.min(i + 1000, teams.length)}/${teams.length}`);
  }

  // Batch insert Seasons
  console.log("Inserting Seasons...");
  await pg.season.createMany({
    data: seasons.map((r) => ({
      id: r.id as number,
      leagueId: r.leagueId as number,
      name: r.name as string,
      startYear: r.startYear as number,
      endYear: r.endYear as number,
      wikipediaPage: r.wikipediaPage as string | null,
      lastScraped: toEpochMs(r.lastScraped),
      fixtureCount: r.fixtureCount as number,
      resultCount: r.resultCount as number,
      createdAt: toEpochMs(r.createdAt) ?? new Date(),
      updatedAt: toEpochMs(r.updatedAt) ?? new Date(),
    })),
  });
  console.log(`  ✓ ${seasons.length} seasons`);

  // Batch insert Fixtures (1000 at a time)
  console.log("Inserting Fixtures...");
  for (let i = 0; i < fixtures.length; i += 1000) {
    const batch = fixtures.slice(i, i + 1000);
    await pg.fixture.createMany({
      data: batch.map((r) => ({
        id: r.id as number,
        seasonId: r.seasonId as number,
        leagueId: r.leagueId as number,
        homeTeamId: r.homeTeamId as number,
        awayTeamId: r.awayTeamId as number,
        matchday: r.matchday as number | null,
        date: toEpochMs(r.date) ?? new Date(),
        time: r.time as string | null,
        homeScore: r.homeScore as number | null,
        awayScore: r.awayScore as number | null,
        status: r.status as string,
        venue: r.venue as string | null,
        attendance: r.attendance as number | null,
        referee: r.referee as string | null,
        createdAt: toEpochMs(r.createdAt) ?? new Date(),
        updatedAt: toEpochMs(r.updatedAt) ?? new Date(),
      })),
    });
    console.log(`  ✓ ${Math.min(i + 1000, fixtures.length)}/${fixtures.length}`);
  }

  // Batch insert Predictions (1000 at a time)
  console.log("Inserting Predictions...");
  for (let i = 0; i < predictions.length; i += 1000) {
    const batch = predictions.slice(i, i + 1000);
    await pg.prediction.createMany({
      data: batch.map((r) => {
        let probs = r.probabilities;
        if (typeof probs === "string") {
          try { probs = JSON.parse(probs as string); } catch {}
        }
        return {
          id: r.id as number,
          fixtureId: r.fixtureId as number,
          market: r.market as string,
          probabilities: probs as any,
          topPick: r.topPick as string,
          confidence: r.confidence as number,
          modelVersion: r.modelVersion as string | null,
          createdAt: toEpochMs(r.createdAt) ?? new Date(),
        };
      }),
    });
    console.log(`  ✓ ${Math.min(i + 1000, predictions.length)}/${predictions.length}`);
  }

  console.log("\n=== DONE ===");
  console.log(`  Leagues:     ${leagues.length}`);
  console.log(`  Teams:       ${teams.length}`);
  console.log(`  Seasons:     ${seasons.length}`);
  console.log(`  Fixtures:    ${fixtures.length}`);
  console.log(`  Predictions: ${predictions.length}`);

  sqlite.close();
  await pg.$disconnect();
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  sqlite.close();
  pg.$disconnect();
  process.exit(1);
});
