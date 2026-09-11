import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const fixturesRouter = Router();

fixturesRouter.get("/", async (req, res) => {
  const { league, date, from, to, status, matchday } = req.query;
  const limit = Math.min(parseInt((req.query.limit as string) || "100"), 500);
  const offset = parseInt((req.query.offset as string) || "0");

  const where: Record<string, unknown> = {};

  if (league) {
    where.league = { slug: league };
  }

  if (status) {
    where.status = status;
  } else {
    where.status = { not: "cancelled" };
  }

  if (matchday) {
    where.matchday = parseInt(matchday as string);
  }

  if (date) {
    const d = new Date(date as string);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  } else if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from as string);
    if (to) (where.date as Record<string, Date>).lte = new Date(to as string);
  }

  const [fixtures, total] = await Promise.all([
    prisma.fixture.findMany({
      where,
      orderBy: { date: "desc" },
      skip: offset,
      take: limit,
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        predictions: true,
      },
    }),
    prisma.fixture.count({ where }),
  ]);

  res.json({ fixtures, total, limit, offset });
});

fixturesRouter.get("/:id", async (req, res) => {
  const fixture = await prisma.fixture.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      league: true,
      homeTeam: true,
      awayTeam: true,
      predictions: true,
      season: true,
    },
  });
  if (!fixture) {
    return res.status(404).json({ error: "Fixture not found" });
  }
  res.json(fixture);
});
