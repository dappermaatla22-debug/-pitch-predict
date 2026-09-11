import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import TeamLogo from "../components/TeamLogo";
import ConfidenceBar from "../components/ConfidenceBar";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/LoadingSkeleton";
import type { Team as TeamType, Fixture } from "../types";

export default function Team() {
  const { id } = useParams();
  const [team, setTeam] = useState<TeamType | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const teamId = parseInt(id);
    Promise.all([api.teams.get(teamId), api.teams.fixtures(teamId)])
      .then(([t, f]) => {
        setTeam(t);
        setFixtures(f);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-32" />
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-3 w-28" />
          </div>
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState title="Team not found" description="This team may have been removed." />
    );
  }

  const recentResults = fixtures
    .filter((f) => f.status === "finished" && f.homeScore !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  function getResult(f: Fixture): "W" | "D" | "L" {
    if (f.homeScore === null || f.awayScore === null) return "D";
    if (f.homeTeamId === team!.id) {
      if (f.homeScore > f.awayScore) return "W";
      if (f.homeScore < f.awayScore) return "L";
    } else {
      if (f.awayScore > f.homeScore) return "W";
      if (f.awayScore < f.homeScore) return "L";
    }
    return "D";
  }

  const formColors = { W: "bg-win text-white", D: "bg-draw text-midnight", L: "bg-loss text-white" };

  return (
    <div className="space-y-6">
      <Link
        to="/fixtures"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-cyan-pulse"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-pulse/5 to-transparent p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <TeamLogo url={team.logoUrl} name={team.name} size="xl" />
            <div>
              <h1 className="font-heading text-xl font-bold text-white sm:text-2xl">
                {team.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <span>{team.country}</span>
                {team.league && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span>{team.league.name}</span>
                  </>
                )}
                {team.founded && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span>Est. {team.founded}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 sm:p-6"
      >
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          PITCH PREDICT AI Ratings
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-gray-400">Attack</span>
              <span className="font-heading font-bold tabular-nums text-cyan-pulse">
                {team.attackRating.toFixed(2)}
              </span>
            </div>
            <ConfidenceBar value={Math.min(team.attackRating / 2, 1)} size="lg" showLabel={false} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-gray-400">Defense</span>
              <span className="font-heading font-bold tabular-nums text-cyan-pulse">
                {team.defenseRating.toFixed(2)}
              </span>
            </div>
            <ConfidenceBar value={Math.min(team.defenseRating / 2, 1)} size="lg" showLabel={false} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-gray-400">Home Advantage</span>
              <span className="font-heading font-bold tabular-nums text-cyan-pulse">
                {team.homeAdvantage.toFixed(2)}
              </span>
            </div>
            <ConfidenceBar value={Math.min(team.homeAdvantage / 2, 1)} size="lg" showLabel={false} />
          </div>
        </div>
      </motion.div>

      {recentResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-3 font-heading text-sm font-semibold text-gray-300">
            Recent Form
          </h3>
          <div className="flex gap-1.5 mb-4">
            {recentResults.slice(0, 5).map((f) => (
              <div
                key={f.id}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${formColors[getResult(f)]}`}
              >
                {getResult(f)}
              </div>
            ))}
          </div>

          <h3 className="mb-3 font-heading text-sm font-semibold text-gray-300">
            Recent Results
          </h3>
          <div className="space-y-2">
            {recentResults.map((f, i) => {
              const result = getResult(f);
              const isHome = f.homeTeamId === team.id;
              const opponent = isHome ? f.awayTeam : f.homeTeam;
              const scored = isHome ? f.homeScore : f.awayScore;
              const conceded = isHome ? f.awayScore : f.homeScore;

              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/match/${f.id}`}
                    className="glass-card-interactive flex items-center gap-3 p-3"
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${formColors[result]}`}
                    >
                      {result}
                    </div>
                    <TeamLogo url={opponent.logoUrl} name={opponent.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-200">
                        {isHome ? "vs" : "@"} {opponent.shortName || opponent.name}
                      </span>
                    </div>
                    <span className="font-heading text-sm font-bold tabular-nums text-white">
                      {scored} - {conceded}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(f.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
