import { prisma } from "../../lib/prisma.js";

// ─── Poisson Distribution ──────────────────────────────────────

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// ─── Dixon-Coles Correction ────────────────────────────────────

//tau function for Dixon-Coles adjustment (adjusts low-scoring probabilities)
function tauCorrection(x: number, y: number, lambda: number, mu: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lambda * mu * rho;
  if (x === 0 && y === 1) return 1 + lambda * rho;
  if (x === 1 && y === 0) return 1 + mu * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

// ─── Goal Probability Matrix ───────────────────────────────────

export function calculateGoalMatrix(
  homeLambda: number,
  awayLambda: number,
  rho: number,
  maxGoals: number = 10,
): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i <= maxGoals; i++) {
    matrix[i] = [];
    for (let j = 0; j <= maxGoals; j++) {
      const poisson = poissonPMF(i, homeLambda) * poissonPMF(j, awayLambda);
      const correction = tauCorrection(i, j, homeLambda, awayLambda, rho);
      matrix[i][j] = poisson * correction;
    }
  }

  // Normalize so total probability = 1
  let total = 0;
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      total += matrix[i][j];
    }
  }
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      matrix[i][j] /= total;
    }
  }

  return matrix;
}

// ─── Match Outcome Probabilities ───────────────────────────────

export function getMatchProbabilities(
  matrix: number[][],
  maxGoals: number = 10,
): { home: number; draw: number; away: number } {
  let home = 0;
  let draw = 0;
  let away = 0;

  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      if (i > j) home += matrix[i][j];
      else if (i === j) draw += matrix[i][j];
      else away += matrix[i][j];
    }
  }

  return { home, draw, away };
}

// ─── Expected Goals ────────────────────────────────────────────

export function getExpectedGoals(matrix: number[][], maxGoals: number = 10): { homeXG: number; awayXG: number } {
  let homeXG = 0;
  let awayXG = 0;

  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      homeXG += i * matrix[i][j];
      awayXG += j * matrix[i][j];
    }
  }

  return { homeXG, awayXG };
}

// ─── Most Likely Score ─────────────────────────────────────────

export function getMostLikelyScore(matrix: number[][], maxGoals: number = 10): { home: number; away: number; probability: number } {
  let bestProb = 0;
  let bestHome = 0;
  let bestAway = 0;

  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      if (matrix[i][j] > bestProb) {
        bestProb = matrix[i][j];
        bestHome = i;
        bestAway = j;
      }
    }
  }

  return { home: bestHome, away: bestAway, probability: bestProb };
}

// ─── Both Teams Score Probability ──────────────────────────────

export function getBTSProb(matrix: number[][], maxGoals: number = 10): number {
  let prob = 0;
  for (let i = 1; i <= maxGoals; i++) {
    for (let j = 1; j <= maxGoals; j++) {
      prob += matrix[i][j];
    }
  }
  return prob;
}

// ─── Over/Under Probabilities ──────────────────────────────────

export function getOverUnderProb(matrix: number[][], line: number = 2.5, maxGoals: number = 10): { over: number; under: number } {
  let over = 0;
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      if (i + j > line) over += matrix[i][j];
    }
  }
  return { over, under: 1 - over };
}

// ─── Team Rating Calculator ────────────────────────────────────

interface TeamStats {
  teamId: number;
  homeGoalsFor: number[];
  homeGoalsAgainst: number[];
  awayGoalsFor: number[];
  awayGoalsAgainst: number[];
  matchesPlayed: number;
}

export async function calculateTeamRatings(leagueId?: number): Promise<void> {
  console.log("Calculating team ratings...");

  // Get all finished fixtures
  const where: any = { status: "finished", homeScore: { not: null }, awayScore: { not: null } };
  if (leagueId) where.leagueId = leagueId;

  const fixtures = await prisma.fixture.findMany({
    where,
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      leagueId: true,
    },
    orderBy: { date: "asc" },
  });

  console.log(`  Processing ${fixtures.length} finished fixtures...`);

  // Aggregate stats per team
  const teamStats = new Map<number, TeamStats>();

  for (const f of fixtures) {
    if (f.homeScore === null || f.awayScore === null) continue;

    // Home team stats
    if (!teamStats.has(f.homeTeamId)) {
      teamStats.set(f.homeTeamId, {
        teamId: f.homeTeamId,
        homeGoalsFor: [], homeGoalsAgainst: [],
        awayGoalsFor: [], awayGoalsAgainst: [],
        matchesPlayed: 0,
      });
    }
    const ht = teamStats.get(f.homeTeamId)!;
    ht.homeGoalsFor.push(f.homeScore);
    ht.homeGoalsAgainst.push(f.awayScore);
    ht.matchesPlayed++;

    // Away team stats
    if (!teamStats.has(f.awayTeamId)) {
      teamStats.set(f.awayTeamId, {
        teamId: f.awayTeamId,
        homeGoalsFor: [], homeGoalsAgainst: [],
        awayGoalsFor: [], awayGoalsAgainst: [],
        matchesPlayed: 0,
      });
    }
    const at = teamStats.get(f.awayTeamId)!;
    at.awayGoalsFor.push(f.awayScore);
    at.awayGoalsAgainst.push(f.homeScore);
    at.matchesPlayed++;
  }

  // Calculate league averages
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let totalMatches = fixtures.length;

  for (const f of fixtures) {
    if (f.homeScore !== null) totalHomeGoals += f.homeScore;
    if (f.awayScore !== null) totalAwayGoals += f.awayScore;
  }

  const avgHomeGoals = totalMatches > 0 ? totalHomeGoals / totalMatches : 1.5;
  const avgAwayGoals = totalMatches > 0 ? totalAwayGoals / totalMatches : 1.1;
  const avgGoals = (totalHomeGoals + totalAwayGoals) / (totalMatches * 2);

  console.log(`  League averages: Home ${avgHomeGoals.toFixed(2)}, Away ${avgAwayGoals.toFixed(2)}, Overall ${avgGoals.toFixed(2)}`);

  // Calculate ratings using iterative method
  const NUM_ITERATIONS = 10;
  const attackRatings = new Map<number, number>();
  const defenseRatings = new Map<number, number>();
  const homeAdvantages = new Map<number, number>();

  // Initialize all ratings to 1.0
  for (const [teamId] of teamStats) {
    attackRatings.set(teamId, 1.0);
    defenseRatings.set(teamId, 1.0);
    homeAdvantages.set(teamId, 1.0);
  }

  for (let iter = 0; iter < NUM_ITERATIONS; iter++) {
    let attackSum = 0;
    let defenseSum = 0;
    let haSum = 0;
    let count = 0;

    for (const [teamId, stats] of teamStats) {
      if (stats.matchesPlayed < 3) continue;

      // Attack rating: actual goals scored / expected goals
      const totalScored = stats.homeGoalsFor.reduce((a, b) => a + b, 0) +
        stats.awayGoalsFor.reduce((a, b) => a + b, 0);
      const homePlayed = stats.homeGoalsFor.length;
      const awayPlayed = stats.awayGoalsFor.length;

      const expectedHomeScored = homePlayed * avgHomeGoals * (1 / (defenseRatings.get(teamId) || 1));
      const expectedAwayScored = awayPlayed * avgAwayGoals * (1 / (defenseRatings.get(teamId) || 1));

      const newAttack = (totalScored + 0.1) / (expectedHomeScored + expectedAwayScored + 0.2);
      attackRatings.set(teamId, newAttack);
      attackSum += newAttack;

      // Defense rating: actual goals conceded / expected goals conceded
      const totalConceded = stats.homeGoalsAgainst.reduce((a, b) => a + b, 0) +
        stats.awayGoalsAgainst.reduce((a, b) => a + b, 0);

      const expectedHomeConceded = homePlayed * avgHomeGoals * (attackRatings.get(teamId) || 1);
      const expectedAwayConceded = awayPlayed * avgAwayGoals * (attackRatings.get(teamId) || 1);

      const newDefense = (totalConceded + 0.1) / (expectedHomeConceded + expectedAwayConceded + 0.2);
      defenseRatings.set(teamId, newDefense);
      defenseSum += newDefense;

      // Home advantage: home goals / away goals ratio
      const homeGoalsTotal = stats.homeGoalsFor.reduce((a, b) => a + b, 0);
      const awayGoalsTotal = stats.awayGoalsFor.reduce((a, b) => a + b, 0);
      const ha = homePlayed > 0 && awayPlayed > 0
        ? (homeGoalsTotal / homePlayed) / ((awayGoalsTotal / awayPlayed) || 1)
        : 1.0;
      homeAdvantages.set(teamId, Math.max(0.5, Math.min(2.0, ha)));
      haSum += homeAdvantages.get(teamId)!;
      count++;
    }

    // Normalize ratings
    const avgAttack = attackSum / count || 1;
    const avgDefense = defenseSum / count || 1;
    const avgHA = haSum / count || 1;

    for (const [teamId] of teamStats) {
      attackRatings.set(teamId, (attackRatings.get(teamId) || 1) / avgAttack);
      defenseRatings.set(teamId, (defenseRatings.get(teamId) || 1) / avgDefense);
      homeAdvantages.set(teamId, (homeAdvantages.get(teamId) || 1) / avgHA);
    }
  }

  // Update database
  let updated = 0;
  for (const [teamId] of teamStats) {
    const stats = teamStats.get(teamId)!;
    if (stats.matchesPlayed < 3) continue;

    await prisma.team.update({
      where: { id: teamId },
      data: {
        attackRating: attackRatings.get(teamId) || 1.0,
        defenseRating: defenseRatings.get(teamId) || 1.0,
        homeAdvantage: homeAdvantages.get(teamId) || 1.0,
        lastRatedAt: new Date(),
      },
    });
    updated++;
  }

  console.log(`  Updated ratings for ${updated} teams`);
}

// ─── Generate Prediction for a Single Fixture ──────────────────

export async function generatePrediction(fixtureId: number): Promise<void> {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { homeTeam: true, awayTeam: true, league: true },
  });

  if (!fixture || !fixture.homeTeam || !fixture.awayTeam) return;

  const home = fixture.homeTeam;
  const away = fixture.awayTeam;

  // League average goals (approximate from DB stats)
  const leagueAvg = await getLeagueAverages(fixture.leagueId);

  // Calculate expected goals using team ratings
  const homeLambda = home.attackRating * away.defenseRating * leagueAvg.homeGoals * home.homeAdvantage;
  const awayLambda = away.attackRating * home.defenseRating * leagueAvg.awayGoals;

  // Dixon-Coles rho parameter (correlation between home and away goals)
  const rho = -0.13; // Typical value from Dixon-Coles paper

  // Calculate goal probability matrix
  const matrix = calculateGoalMatrix(homeLambda, awayLambda, rho);

  // Get all probabilities
  const outcome = getMatchProbabilities(matrix);
  const { homeXG, awayXG } = getExpectedGoals(matrix);
  const mostLikely = getMostLikelyScore(matrix);
  const bts = getBTSProb(matrix);
  const overUnder25 = getOverUnderProb(matrix, 2.5);
  const overUnder15 = getOverUnderProb(matrix, 1.5);
  const overUnder35 = getOverUnderProb(matrix, 3.5);

  // Determine top pick (highest confidence outcome)
  const picks = [
    { market: "1X2", pick: "Home", prob: outcome.home },
    { market: "1X2", pick: "Draw", prob: outcome.draw },
    { market: "1X2", pick: "Away", prob: outcome.away },
    { market: "BTTS", pick: "Yes", prob: bts },
    { market: "BTTS", pick: "No", prob: 1 - bts },
    { market: "Over/Under 2.5", pick: "Over", prob: overUnder25.over },
    { market: "Over/Under 2.5", pick: "Under", prob: overUnder25.under },
    { market: "Over/Under 1.5", pick: "Over", prob: overUnder15.over },
    { market: "Over/Under 1.5", pick: "Under", prob: overUnder15.under },
    { market: "Over/Under 3.5", pick: "Over", prob: overUnder35.over },
    { market: "Over/Under 3.5", pick: "Under", prob: overUnder35.under },
    { market: "Correct Score", pick: `${mostLikely.home}-${mostLikely.away}`, prob: mostLikely.probability },
  ];

  // Sort by probability to find highest confidence pick
  picks.sort((a, b) => b.prob - a.prob);
  const topPick = picks[0];

  // Store predictions
  const predictions = [
    {
      fixtureId,
      market: "1X2",
      probabilities: {
        home: Math.round(outcome.home * 1000) / 1000,
        draw: Math.round(outcome.draw * 1000) / 1000,
        away: Math.round(outcome.away * 1000) / 1000,
        homeXG: Math.round(homeXG * 100) / 100,
        awayXG: Math.round(awayXG * 100) / 100,
        mostLikelyScore: `${mostLikely.home}-${mostLikely.away}`,
        mostLikelyScoreProb: Math.round(mostLikely.probability * 1000) / 1000,
      },
      topPick: topPick.market === "1X2" ? topPick.pick : "Home",
      confidence: Math.round(Math.max(outcome.home, outcome.draw, outcome.away) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    },
    {
      fixtureId,
      market: "BTTS",
      probabilities: {
        yes: Math.round(bts * 1000) / 1000,
        no: Math.round((1 - bts) * 1000) / 1000,
      },
      topPick: bts > 0.5 ? "Yes" : "No",
      confidence: Math.round(Math.max(bts, 1 - bts) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    },
    {
      fixtureId,
      market: "Over/Under 2.5",
      probabilities: {
        over: Math.round(overUnder25.over * 1000) / 1000,
        under: Math.round(overUnder25.under * 1000) / 1000,
      },
      topPick: overUnder25.over > 0.5 ? "Over" : "Under",
      confidence: Math.round(Math.max(overUnder25.over, overUnder25.under) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    },
    {
      fixtureId,
      market: "Over/Under 1.5",
      probabilities: {
        over: Math.round(overUnder15.over * 1000) / 1000,
        under: Math.round(overUnder15.under * 1000) / 1000,
      },
      topPick: overUnder15.over > 0.5 ? "Over" : "Under",
      confidence: Math.round(Math.max(overUnder15.over, overUnder15.under) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    },
    {
      fixtureId,
      market: "Over/Under 3.5",
      probabilities: {
        over: Math.round(overUnder35.over * 1000) / 1000,
        under: Math.round(overUnder35.under * 1000) / 1000,
      },
      topPick: overUnder35.over > 0.5 ? "Over" : "Under",
      confidence: Math.round(Math.max(overUnder35.over, overUnder35.under) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    },
    {
      fixtureId,
      market: "Correct Score",
      probabilities: {
        "1-0": Math.round((matrix[1]?.[0] || 0) * 1000) / 1000,
        "0-1": Math.round((matrix[0]?.[1] || 0) * 1000) / 1000,
        "1-1": Math.round((matrix[1]?.[1] || 0) * 1000) / 1000,
        "2-1": Math.round((matrix[2]?.[1] || 0) * 1000) / 1000,
        "1-2": Math.round((matrix[1]?.[2] || 0) * 1000) / 1000,
        "2-0": Math.round((matrix[2]?.[0] || 0) * 1000) / 1000,
        "0-2": Math.round((matrix[0]?.[2] || 0) * 1000) / 1000,
        "2-2": Math.round((matrix[2]?.[2] || 0) * 1000) / 1000,
        "3-1": Math.round((matrix[3]?.[1] || 0) * 1000) / 1000,
        "1-3": Math.round((matrix[1]?.[3] || 0) * 1000) / 1000,
        "3-0": Math.round((matrix[3]?.[0] || 0) * 1000) / 1000,
        "0-3": Math.round((matrix[0]?.[3] || 0) * 1000) / 1000,
        "3-2": Math.round((matrix[3]?.[2] || 0) * 1000) / 1000,
        "2-3": Math.round((matrix[2]?.[3] || 0) * 1000) / 1000,
        "0-0": Math.round((matrix[0]?.[0] || 0) * 1000) / 1000,
      },
      topPick: mostLikely.home + "-" + mostLikely.away,
      confidence: Math.round(mostLikely.probability * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    },
  ];

  for (const pred of predictions) {
    await prisma.prediction.upsert({
      where: { fixtureId_market: { fixtureId, market: pred.market } },
      create: pred,
      update: pred,
    });
  }
}

// ─── League Averages ───────────────────────────────────────────

async function getLeagueAverages(leagueId: number): Promise<{ homeGoals: number; awayGoals: number }> {
  const fixtures = await prisma.fixture.findMany({
    where: {
      leagueId,
      status: "finished",
      homeScore: { not: null },
      awayScore: { not: null },
    },
    select: { homeScore: true, awayScore: true },
    take: 500,
  });

  if (fixtures.length === 0) return { homeGoals: 1.5, awayGoals: 1.1 };

  let homeGoals = 0;
  let awayGoals = 0;
  for (const f of fixtures) {
    homeGoals += f.homeScore || 0;
    awayGoals += f.awayScore || 0;
  }

  return {
    homeGoals: homeGoals / fixtures.length,
    awayGoals: awayGoals / fixtures.length,
  };
}

// ─── Batch Prediction Generator ────────────────────────────────

export async function generateAllPredictions(leagueId?: number): Promise<void> {
  console.log("Generating predictions...");

  // First calculate team ratings
  await calculateTeamRatings(leagueId);

  // Load ALL data in bulk queries (not per-fixture)
  const where: any = { status: { in: ["finished", "upcoming"] } };
  if (leagueId) where.leagueId = leagueId;

  const fixtures = await prisma.fixture.findMany({
    where,
    include: { homeTeam: true, awayTeam: true },
    orderBy: { date: "asc" },
  });

  console.log(`  Loaded ${fixtures.length} finished fixtures`);

  // Cache league averages per league
  const leagueAvgCache = new Map<number, { homeGoals: number; awayGoals: number }>();
  for (const f of fixtures) {
    if (!leagueAvgCache.has(f.leagueId)) {
      const avg = await getLeagueAverages(f.leagueId);
      leagueAvgCache.set(f.leagueId, avg);
    }
  }

  // Compute all predictions in memory
  const rho = -0.13;
  const allPredictions: { fixtureId: number; market: string; probabilities: string; topPick: string; confidence: number; modelVersion: string }[] = [];
  let processed = 0;

  for (const f of fixtures) {
    if (!f.homeTeam || !f.awayTeam) continue;

    const leagueAvg = leagueAvgCache.get(f.leagueId) || { homeGoals: 1.5, awayGoals: 1.1 };
    const home = f.homeTeam;
    const away = f.awayTeam;

    const homeLambda = home.attackRating * away.defenseRating * leagueAvg.homeGoals * home.homeAdvantage;
    const awayLambda = away.attackRating * home.defenseRating * leagueAvg.awayGoals;

    const matrix = calculateGoalMatrix(homeLambda, awayLambda, rho);
    const outcome = getMatchProbabilities(matrix);
    const { homeXG, awayXG } = getExpectedGoals(matrix);
    const mostLikely = getMostLikelyScore(matrix);
    const bts = getBTSProb(matrix);
    const overUnder25 = getOverUnderProb(matrix, 2.5);

    // 1X2 prediction
    const maxOutcome = Math.max(outcome.home, outcome.draw, outcome.away);
    const winner = outcome.home >= outcome.draw && outcome.home >= outcome.away ? "Home"
      : outcome.away >= outcome.draw ? "Away" : "Draw";

    allPredictions.push({
      fixtureId: f.id,
      market: "1X2",
      probabilities: JSON.stringify({
        home: Math.round(outcome.home * 1000) / 1000,
        draw: Math.round(outcome.draw * 1000) / 1000,
        away: Math.round(outcome.away * 1000) / 1000,
        homeXG: Math.round(homeXG * 100) / 100,
        awayXG: Math.round(awayXG * 100) / 100,
        mostLikelyScore: `${mostLikely.home}-${mostLikely.away}`,
        mostLikelyScoreProb: Math.round(mostLikely.probability * 1000) / 1000,
      }),
      topPick: winner,
      confidence: Math.round(maxOutcome * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    });

    // BTTS prediction
    allPredictions.push({
      fixtureId: f.id,
      market: "BTTS",
      probabilities: JSON.stringify({
        yes: Math.round(bts * 1000) / 1000,
        no: Math.round((1 - bts) * 1000) / 1000,
      }),
      topPick: bts > 0.5 ? "Yes" : "No",
      confidence: Math.round(Math.max(bts, 1 - bts) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    });

    // O/U 2.5 prediction
    allPredictions.push({
      fixtureId: f.id,
      market: "Over/Under 2.5",
      probabilities: JSON.stringify({
        over: Math.round(overUnder25.over * 1000) / 1000,
        under: Math.round(overUnder25.under * 1000) / 1000,
      }),
      topPick: overUnder25.over > 0.5 ? "Over" : "Under",
      confidence: Math.round(Math.max(overUnder25.over, overUnder25.under) * 1000) / 1000,
      modelVersion: "dixon-coles-v1",
    });

    processed++;
    if (processed % 500 === 0) console.log(`    Processed ${processed}/${fixtures.length}...`);
  }

  console.log(`  Computed ${allPredictions.length} predictions for ${processed} fixtures`);

  // Batch delete existing predictions, then insert
  if (allPredictions.length > 0) {
    const fixtureIds = [...new Set(allPredictions.map((p) => p.fixtureId))];
    await prisma.prediction.deleteMany({ where: { fixtureId: { in: fixtureIds } } });
    console.log(`  Cleared existing predictions for ${fixtureIds.length} fixtures`);

    // Insert in batches of 500
    const BATCH = 500;
    for (let i = 0; i < allPredictions.length; i += BATCH) {
      const batch = allPredictions.slice(i, i + BATCH);
      await prisma.prediction.createMany({ data: batch });
    }
    console.log(`  Inserted ${allPredictions.length} predictions`);
  }

  console.log(`  Done! ${processed} fixtures predicted`);
}
