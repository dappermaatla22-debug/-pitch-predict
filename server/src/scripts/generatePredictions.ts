import "dotenv/config";
import { generateAllPredictions } from "../services/prediction/prediction-engine.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  const targetLeague = process.argv[2];

  console.log("=== Pitch Predict — Prediction Generator ===\n");

  if (targetLeague) {
    const league = await prisma.league.findFirst({ where: { name: targetLeague } });
    if (!league) {
      console.error(`League not found: ${targetLeague}`);
      process.exit(1);
    }
    console.log(`Target league: ${league.name} (id: ${league.id})\n`);
    await generateAllPredictions(league.id);
  } else {
    console.log("Generating predictions for all leagues...\n");
    await generateAllPredictions();
  }

  // Show summary
  console.log("\n=== Prediction Summary ===\n");

  const leagues = await prisma.league.findMany({
    include: {
      _count: { select: { fixtures: true } },
      fixtures: {
        where: { status: "finished" },
        include: { predictions: true },
      },
    },
    orderBy: { name: "asc" },
  });

  for (const league of leagues) {
    const finished = league.fixtures.length;
    const withPredictions = league.fixtures.filter((f) => f.predictions.length > 0).length;
    const totalPredictions = league.fixtures.reduce((sum, f) => sum + f.predictions.length, 0);
    if (finished > 0) {
      console.log(`  ${league.name}: ${withPredictions}/${finished} fixtures predicted (${totalPredictions} predictions)`);
    }
  }

  const totalPredictions = await prisma.prediction.count();
  const totalFixtures = await prisma.fixture.count({ where: { status: "finished" } });
  console.log(`\n  Total: ${totalPredictions} predictions for ${totalFixtures} finished fixtures`);

  // Show top predictions
  console.log("\n=== Top 10 Predictions (by confidence) ===\n");

  const topPreds = await prisma.prediction.findMany({
    where: { market: "1X2" },
    orderBy: { confidence: "desc" },
    take: 10,
    include: {
      fixture: {
        include: { homeTeam: true, awayTeam: true, league: true },
      },
    },
  });

  for (const pred of topPreds) {
    const f = pred.fixture;
    const probs = pred.probabilities as any;
    console.log(
      `  [${f.league.name}] ${f.homeTeam.name} vs ${f.awayTeam.name} ` +
      `→ ${pred.topPick} (${(pred.confidence * 100).toFixed(1)}%) ` +
      `[H:${(probs.home * 100).toFixed(1)}% D:${(probs.draw * 100).toFixed(1)}% A:${(probs.away * 100).toFixed(1)}%]`
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Prediction generation failed:", err);
  process.exit(1);
});
