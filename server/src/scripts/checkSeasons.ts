import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const seasons = await p.season.findMany({ orderBy: { id: "asc" } });
  console.log(`Total seasons: ${seasons.length}\n`);

  for (const s of seasons) {
    const counts = await p.fixture.groupBy({
      by: ["status"],
      where: { seasonId: s.id },
      _count: true,
    });
    const league = await p.league.findUnique({ where: { id: s.leagueId } });
    const statusStr = counts.map(c => `${c.status}:${c._count}`).join(", ");
    console.log(`  ID:${s.id} | ${s.name} | ${league?.name}: ${statusStr}`);
  }

  await p.$disconnect();
}

main().catch(console.error);
