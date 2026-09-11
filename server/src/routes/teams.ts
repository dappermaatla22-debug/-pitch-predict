import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const teamsRouter = Router();

teamsRouter.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { shortName: { contains: q } },
      ],
    },
    take: 20,
    include: { league: true },
  });

  res.json(teams);
});

teamsRouter.get("/:id", async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { league: true },
  });
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }
  res.json(team);
});

teamsRouter.get("/:id/form", async (req, res) => {
  const teamId = parseInt(req.params.id);
  const limit = parseInt((req.query.limit as string) || "10");

  const homeFixtures = await prisma.fixture.findMany({
    where: { homeTeamId: teamId, status: "finished" },
    orderBy: { date: "desc" },
    take: limit,
    include: { awayTeam: true, league: true },
  });

  const awayFixtures = await prisma.fixture.findMany({
    where: { awayTeamId: teamId, status: "finished" },
    orderBy: { date: "desc" },
    take: limit,
    include: { homeTeam: true, league: true },
  });

  const all = [...homeFixtures, ...awayFixtures]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  res.json(all);
});

teamsRouter.get("/:id/fixtures", async (req, res) => {
  const teamId = parseInt(req.params.id);

  const fixtures = await prisma.fixture.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { date: "asc" },
    include: { homeTeam: true, awayTeam: true, league: true, predictions: true },
  });

  res.json(fixtures);
});

teamsRouter.get("/:id/h2h/:opponentId", async (req, res) => {
  const teamId = parseInt(req.params.id);
  const opponentId = parseInt(req.params.opponentId);

  const fixtures = await prisma.fixture.findMany({
    where: {
      OR: [
        { homeTeamId: teamId, awayTeamId: opponentId },
        { homeTeamId: opponentId, awayTeamId: teamId },
      ],
      status: "finished",
    },
    orderBy: { date: "desc" },
    take: 20,
    include: { homeTeam: true, awayTeam: true },
  });

  res.json(fixtures);
});
