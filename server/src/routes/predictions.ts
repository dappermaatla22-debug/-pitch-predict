import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const predictionsRouter = Router();

predictionsRouter.get("/top", async (req, res) => {
  const limit = parseInt((req.query.limit as string) || "50");
  const minConfidence = parseFloat(
    (req.query.minConfidence as string) || "0",
  );
  const status = (req.query.status as string) || "finished";

  const predictions = await prisma.prediction.findMany({
    where: {
      confidence: { gte: minConfidence },
      fixture: { status },
    },
    orderBy: { confidence: "desc" },
    take: limit,
    include: {
      fixture: {
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      },
    },
  });

  res.json(predictions);
});

predictionsRouter.get("/best-picks", async (req, res) => {
  const limit = parseInt((req.query.limit as string) || "10");
  const dateStr = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const minConfidence = parseFloat((req.query.minConfidence as string) || "0");

  const startDate = new Date(dateStr);
  const endDate = new Date(dateStr);
  endDate.setDate(endDate.getDate() + 1);

  const fixtures = await prisma.fixture.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
      status: { in: ["upcoming", "finished"] },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true,
      predictions: {
        orderBy: { confidence: "desc" },
        take: 1,
      },
    },
    orderBy: { date: "asc" },
  });

  const picks = fixtures
    .filter((f) => f.predictions.length > 0)
    .map((f) => ({
      fixture: {
        id: f.id,
        date: f.date,
        status: f.status,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
        matchday: f.matchday,
      },
      homeTeam: { id: f.homeTeam.id, name: f.homeTeam.name, shortName: f.homeTeam.shortName, logoUrl: f.homeTeam.logoUrl },
      awayTeam: { id: f.awayTeam.id, name: f.awayTeam.name, shortName: f.awayTeam.shortName, logoUrl: f.awayTeam.logoUrl },
      league: { id: f.league.id, name: f.league.name, slug: f.league.slug, logoUrl: f.league.logoUrl },
      prediction: f.predictions[0],
    }))
    .filter((p) => p.prediction.confidence >= minConfidence)
    .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
    .slice(0, limit);

  res.json(picks);
});

predictionsRouter.get("/accuracy", async (_req, res) => {
  const total = await prisma.prediction.count();
  const withResults = await prisma.prediction.count({
    where: { result: { isNot: null } },
  });
  const correct = await prisma.prediction.count({
    where: { result: { wasCorrect: true } },
  });

  const byMarket = await prisma.predictionResult.groupBy({
    by: ["wasCorrect"],
    _count: true,
  });

  res.json({
    total,
    withResults,
    correct,
    accuracy: withResults > 0 ? correct / withResults : 0,
    results: byMarket,
  });
});

predictionsRouter.get("/fixture/:fixtureId", async (req, res) => {
  const predictions = await prisma.prediction.findMany({
    where: { fixtureId: parseInt(req.params.fixtureId) },
    orderBy: { confidence: "desc" },
    include: {
      fixture: {
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      },
    },
  });

  res.json(predictions);
});

predictionsRouter.get("/performance", async (req, res) => {
  const results = await prisma.predictionResult.groupBy({
    by: ["wasCorrect"],
    _count: true,
  });

  const byMarket = await prisma.prediction.groupBy({
    by: ["market"],
    _count: true,
    where: { result: { isNot: null } },
  });

  res.json({ overall: results, byMarket });
});
