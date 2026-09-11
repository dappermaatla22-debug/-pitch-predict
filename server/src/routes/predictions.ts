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

predictionsRouter.get("/fixture/:fixtureId", async (req, res) => {
  const predictions = await prisma.prediction.findMany({
    where: { fixtureId: parseInt(req.params.fixtureId) },
    orderBy: { confidence: "desc" },
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
