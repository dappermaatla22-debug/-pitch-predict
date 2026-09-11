import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TeamLogo from "./TeamLogo";
import type { Fixture } from "../types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getStatusBadge(status: string) {
  if (status === "upcoming")
    return <span className="badge-cyan">Upcoming</span>;
  if (status === "finished")
    return <span className="badge bg-white/5 text-gray-400 border border-white/10">FT</span>;
  if (status === "postponed")
    return <span className="badge bg-prime/10 text-prime border border-prime/20">Postponed</span>;
  return null;
}

export default function MatchCard({ fixture }: { fixture: Fixture }) {
  const bestPred = fixture.predictions?.[0];
  const pct = bestPred ? Math.round(bestPred.confidence * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/match/${fixture.id}`} className="block">
        <div className="glass-card-interactive group p-3 sm:p-4">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2.5">
            <span>{fixture.league?.name}</span>
            <div className="flex items-center gap-2">
              <span>{formatDate(fixture.date)}</span>
              <span>{formatTime(fixture.date)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <TeamLogo
                url={fixture.homeTeam?.logoUrl}
                name={fixture.homeTeam?.name || "TBD"}
                size="md"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-200">
                  {fixture.homeTeam?.shortName || fixture.homeTeam?.name || "TBD"}
                </div>
                {fixture.homeScore !== null && (
                  <div className="text-xs text-gray-500">
                    {fixture.homeTeam?.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 px-2 shrink-0">
              {fixture.homeScore !== null && fixture.awayScore !== null ? (
                <span className="font-heading text-xl font-bold text-white tabular-nums">
                  {fixture.homeScore}
                  <span className="text-gray-600 mx-1">-</span>
                  {fixture.awayScore}
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500">vs</span>
              )}
              {getStatusBadge(fixture.status)}
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
              <div className="min-w-0 text-right">
                <div className="truncate text-sm font-medium text-gray-200">
                  {fixture.awayTeam?.shortName || fixture.awayTeam?.name || "TBD"}
                </div>
                {fixture.awayScore !== null && (
                  <div className="text-xs text-gray-500">
                    {fixture.awayTeam?.name}
                  </div>
                )}
              </div>
              <TeamLogo
                url={fixture.awayTeam?.logoUrl}
                name={fixture.awayTeam?.name || "TBD"}
                size="md"
              />
            </div>
          </div>

          {pct !== null && bestPred && (
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
              <div className="text-xs text-gray-500">
                {bestPred.market === "1X2"
                  ? "Match Result"
                  : bestPred.market}
                : <span className="text-gray-300 ml-1">{bestPred.topPick}</span>
              </div>
              <div
                className={`text-sm font-bold tabular-nums ${
                  pct >= 70
                    ? "text-win"
                    : pct >= 55
                      ? "text-cyan-pulse"
                      : pct >= 40
                        ? "text-prime"
                        : "text-gray-400"
                }`}
              >
                {pct}%
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
