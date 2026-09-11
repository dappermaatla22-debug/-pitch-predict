import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TeamLogo from "./TeamLogo";
import type { BestPick } from "../types";

function getMarketLabel(market: string): string {
  const map: Record<string, string> = {
    "1X2": "Match Result",
    "BTTS": "Both Teams to Score",
    "O/U 2.5": "Over/Under 2.5 Goals",
    "O/U 1.5": "Over/Under 1.5 Goals",
    "O/U 3.5": "Over/Under 3.5 Goals",
  };
  return map[market] || market;
}

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

export default function AIPickCard({ pick }: { pick: BestPick }) {
  const pct = Math.round(pick.prediction.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link to={`/match/${pick.fixture.id}`} className="block">
        <div className="glass-card group relative overflow-hidden p-4 transition-all duration-300 hover:border-cyan-pulse/20 hover:shadow-glow">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-pulse/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <span className="badge-cyan text-[10px] uppercase tracking-wider">
                Pitch Predict AI
              </span>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span>{pick.league.name}</span>
                <span className="text-gray-700">|</span>
                <span>{formatDate(pick.fixture.date)}</span>
                <span>{formatTime(pick.fixture.date)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <TeamLogo
                  url={pick.homeTeam.logoUrl}
                  name={pick.homeTeam.name}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-200">
                    {pick.homeTeam.shortName || pick.homeTeam.name}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 px-2">
                {pick.fixture.status === "finished" &&
                pick.fixture.homeScore !== null &&
                pick.fixture.awayScore !== null ? (
                  <span className="font-heading text-xl font-bold text-white">
                    {pick.fixture.homeScore} - {pick.fixture.awayScore}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">VS</span>
                )}
              </div>

              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="min-w-0 text-right">
                  <div className="truncate text-sm font-medium text-gray-200">
                    {pick.awayTeam.shortName || pick.awayTeam.name}
                  </div>
                </div>
                <TeamLogo
                  url={pick.awayTeam.logoUrl}
                  name={pick.awayTeam.name}
                  size="md"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <div className="text-xs text-gray-400">
                {getMarketLabel(pick.prediction.market)}:{" "}
                <span className="font-semibold text-white">
                  {pick.prediction.topPick}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`text-lg font-bold tabular-nums ${
                    pct >= 70
                      ? "text-win"
                      : pct >= 55
                        ? "text-cyan-pulse"
                        : "text-prime"
                  }`}
                >
                  {pct}%
                </div>
                <div className="h-8 w-8 rounded-full border-2 border-current p-0.5">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      className="opacity-20"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${pct} ${100 - pct}`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
