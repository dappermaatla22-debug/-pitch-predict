import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import { formatDate, formatScore } from "../lib/format.ts";
import type { Team as TeamType, Fixture } from "../types/index.ts";

export default function Team() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamType | null>(null);
  const [form, setForm] = useState<Fixture[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const tid = parseInt(id);
    Promise.all([
      api.teams.get(tid),
      api.teams.form(tid, 10),
      api.teams.fixtures(tid),
    ])
      .then(([t, f, fx]) => {
        setTeam(t);
        setForm(f);
        setFixtures(fx);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-lg bg-carbon-elevated" />
        <div className="h-48 animate-pulse rounded-lg bg-carbon-elevated" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="rounded-lg border border-carbon-elevated bg-carbon p-12 text-center">
        <p className="text-gray-500">Team not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/fixtures" className="text-sm text-cyan-pulse hover:underline">
        ← Back
      </Link>

      <div className="rounded-lg border border-carbon-elevated bg-carbon p-6">
        <h2 className="font-heading text-2xl font-bold text-white">
          {team.name}
        </h2>
        {team.league && (
          <p className="text-sm text-gray-500">
            {team.league.name} · {team.country}
          </p>
        )}

        {team.attackRating !== 1.0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-md bg-carbon-elevated p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Attack</div>
              <div className={`font-heading text-lg font-bold ${
                team.attackRating > 1.2 ? "text-emerald-400" : team.attackRating < 0.8 ? "text-red-400" : "text-gray-300"
              }`}>
                {(team.attackRating * 100).toFixed(0)}
              </div>
            </div>
            <div className="rounded-md bg-carbon-elevated p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Defense</div>
              <div className={`font-heading text-lg font-bold ${
                team.defenseRating < 0.8 ? "text-emerald-400" : team.defenseRating > 1.2 ? "text-red-400" : "text-gray-300"
              }`}>
                {(team.defenseRating * 100).toFixed(0)}
              </div>
            </div>
            <div className="rounded-md bg-carbon-elevated p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Home Adv</div>
              <div className={`font-heading text-lg font-bold ${
                team.homeAdvantage > 1.1 ? "text-emerald-400" : team.homeAdvantage < 0.9 ? "text-red-400" : "text-gray-300"
              }`}>
                {(team.homeAdvantage * 100).toFixed(0)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-carbon-elevated bg-carbon p-6">
        <h3 className="font-heading text-lg font-bold text-white mb-4">
          Recent Form
        </h3>
        <div className="flex gap-2">
          {form.map((f) => {
            const isHome = f.homeTeamId === team.id;
            const goalsFor = isHome ? f.homeScore : f.awayScore;
            const goalsAgainst = isHome ? f.awayScore : f.homeScore;
            const won =
              goalsFor !== null &&
              goalsAgainst !== null &&
              goalsFor > goalsAgainst;
            const drawn =
              goalsFor !== null &&
              goalsAgainst !== null &&
              goalsFor === goalsAgainst;
            return (
              <div
                key={f.id}
                className={`flex h-10 w-10 items-center justify-center rounded-md font-heading text-sm font-bold ${
                  won
                    ? "bg-emerald-500/20 text-emerald-400"
                    : drawn
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                }`}
              >
                {won ? "W" : drawn ? "D" : "L"}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-carbon-elevated bg-carbon p-6">
        <h3 className="font-heading text-lg font-bold text-white mb-4">
          Recent Results
        </h3>
        <div className="space-y-2">
          {fixtures
            .filter((f) => f.status === "finished")
            .slice(0, 15)
            .map((f) => (
              <Link
                key={f.id}
                to={`/match/${f.id}`}
                className="flex items-center gap-4 rounded-md px-3 py-2 transition-colors hover:bg-carbon-elevated"
              >
                <span className="text-xs text-gray-500 w-20">
                  {formatDate(f.date)}
                </span>
                <span className="flex-1 text-sm text-white">
                  {f.homeTeamId === team.id
                    ? `vs ${f.awayTeam.shortName || f.awayTeam.name}`
                    : `@ ${f.homeTeam.shortName || f.homeTeam.name}`}
                </span>
                <span className={`text-xs font-semibold ${
                  (() => {
                    const gf = f.homeTeamId === team.id ? f.homeScore : f.awayScore;
                    const ga = f.homeTeamId === team.id ? f.awayScore : f.homeScore;
                    if (gf === null || ga === null) return "text-gray-500";
                    return gf > ga ? "text-emerald-400" : gf === ga ? "text-yellow-400" : "text-red-400";
                  })()
                }`}>
                  {formatScore(f.homeScore, f.awayScore)}
                </span>
              </Link>
            ))}
          {fixtures.filter((f) => f.status === "finished").length === 0 && (
            <p className="text-gray-500 text-sm">No results yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
