import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const leaguesRouter = Router();

leaguesRouter.get("/", async (_req, res) => {
  const leagues = await prisma.league.findMany({
    where: { active: true },
    orderBy: [{ confederation: "asc" }, { tier: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { teams: true, fixtures: true } },
    },
  });
  res.json(leagues);
});

leaguesRouter.get("/:slug", async (req, res) => {
  const league = await prisma.league.findUnique({
    where: { slug: req.params.slug },
    include: {
      seasons: { orderBy: { startYear: "desc" }, take: 1 },
      _count: { select: { teams: true } },
    },
  });
  if (!league) {
    return res.status(404).json({ error: "League not found" });
  }
  res.json(league);
});
