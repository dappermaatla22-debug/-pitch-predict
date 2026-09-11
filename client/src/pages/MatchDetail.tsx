import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import TeamLogo from "../components/TeamLogo";
import ConfidenceBar from "../components/ConfidenceBar";
import EmptyState from "../components/EmptyState";
import type { Fixture, Prediction } from "../types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getMarketLabel(market: string): string {
  const map: Record<string, string> = {
    "1X2": "Match Result",
    BTTS: "Both Teams to Score",
    "O/U 2.5": "Over/Under 2.5 Goals",
    "O/U 1.5": "Over/Under 1.5 Goals",
    "O/U 3.5": "Over/Under 3.5 Goals",
  };
  return map[market] || market;
}

export default function MatchDetail() {
  const { id } = useParams();
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.fixtures.get(parseInt(id)),
      api.predictions.byFixture(parseInt(id)),
    ])
      .then(([f, preds]) => {
        setFixture(f);
        setPredictions(preds);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-32" />
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton h-16 w-16 rounded-full" />
              <div className="skeleton h-5 w-32" />
            </div>
            <div className="skeleton h-10 w-24" />
            <div className="flex items-center gap-3">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-16 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <EmptyState title="Fixture not found" description="This fixture may have been removed." />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/fixtures"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-cyan-pulse"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Fixtures
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="border-b border-white/[0.06] bg-gradient-to-r from-cyan-pulse/5 to-transparent px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{fixture.league.name}</span>
            {fixture.matchday && (
              <>
                <span className="text-gray-700">|</span>
                <span>Matchday {fixture.matchday}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={`/team/${fixture.homeTeam.id}`}
              className="flex flex-1 items-center gap-3 min-w-0 group"
            >
              <TeamLogo
                url={fixture.homeTeam.logoUrl}
                name={fixture.homeTeam.name}
                size="xl"
              />
              <div className="min-w-0">
                <div className="font-heading text-base font-semibold text-gray-200 sm:text-lg group-hover:text-cyan-pulse transition-colors truncate">
                  {fixture.homeTeam.name}
                </div>
                <div className="text-xs text-gray-500">Home</div>
              </div>
            </Link>

            <div className="flex flex-col items-center gap-1 shrink-0 px-2">
              {fixture.homeScore !== null && fixture.awayScore !== null ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="font-heading text-3xl font-bold text-white tabular-nums sm:text-4xl"
                >
                  {fixture.homeScore}
                  <span className="mx-1.5 text-gray-600">-</span>
                  {fixture.awayScore}
                </motion.div>
              ) : (
                <div className="font-heading text-lg text-gray-500">vs</div>
              )}
              <div className="text-xs text-gray-500">
                {formatDate(fixture.date)} · {formatTime(fixture.date)}
              </div>
              {fixture.venue && (
                <div className="text-[11px] text-gray-600">
                  {fixture.venue}
                </div>
              )}
            </div>

            <Link
              to={`/team/${fixture.awayTeam.id}`}
              className="flex flex-1 items-center justify-end gap-3 min-w-0 group"
            >
              <div className="min-w-0 text-right">
                <div className="font-heading text-base font-semibold text-gray-200 sm:text-lg group-hover:text-cyan-pulse transition-colors truncate">
                  {fixture.awayTeam.name}
                </div>
                <div className="text-xs text-gray-500">Away</div>
              </div>
              <TeamLogo
                url={fixture.awayTeam.logoUrl}
                name={fixture.awayTeam.name}
                size="xl"
              />
            </Link>
          </div>
        </div>
      </motion.div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-cyan-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          <h2 className="font-heading text-lg font-semibold text-white">
            PITCH PREDICT AI
          </h2>
          <span className="badge-cyan">Analysis</span>
        </div>

        {predictions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictions.map((pred, i) => (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {getMarketLabel(pred.market)}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      pred.confidence >= 0.7
                        ? "text-win"
                        : pred.confidence >= 0.55
                          ? "text-cyan-pulse"
                          : "text-prime"
                    }`}
                  >
                    {Math.round(pred.confidence * 100)}%
                  </span>
                </div>

                <div className="mb-3 rounded-lg bg-carbon-elevated px-3 py-2 text-center">
                  <span className="font-heading text-lg font-bold text-white">
                    {pred.topPick}
                  </span>
                </div>

                <div className="space-y-2">
                  {Object.entries(pred.probabilities).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-12 text-right text-[11px] text-gray-500">
                        {key}
                      </span>
                      <ConfidenceBar value={val as number} size="sm" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No predictions yet"
            description="PITCH PREDICT AI hasn't analyzed this fixture yet."
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {fixture.homeTeam.name} Ratings
          </h3>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Attack</span>
                <span className="tabular-nums text-cyan-pulse">
                  {fixture.homeTeam.attackRating.toFixed(2)}
                </span>
              </div>
              <ConfidenceBar value={Math.min(fixture.homeTeam.attackRating / 2, 1)} size="sm" showLabel={false} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Defense</span>
                <span className="tabular-nums text-cyan-pulse">
                  {fixture.homeTeam.defenseRating.toFixed(2)}
                </span>
              </div>
              <ConfidenceBar value={Math.min(fixture.homeTeam.defenseRating / 2, 1)} size="sm" showLabel={false} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Home Advantage</span>
                <span className="tabular-nums text-cyan-pulse">
                  {fixture.homeTeam.homeAdvantage.toFixed(2)}
                </span>
              </div>
              <ConfidenceBar value={Math.min(fixture.homeTeam.homeAdvantage / 2, 1)} size="sm" showLabel={false} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {fixture.awayTeam.name} Ratings
          </h3>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Attack</span>
                <span className="tabular-nums text-cyan-pulse">
                  {fixture.awayTeam.attackRating.toFixed(2)}
                </span>
              </div>
              <ConfidenceBar value={Math.min(fixture.awayTeam.attackRating / 2, 1)} size="sm" showLabel={false} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Defense</span>
                <span className="tabular-nums text-cyan-pulse">
                  {fixture.awayTeam.defenseRating.toFixed(2)}
                </span>
              </div>
              <ConfidenceBar value={Math.min(fixture.awayTeam.defenseRating / 2, 1)} size="sm" showLabel={false} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Away Rating</span>
                <span className="tabular-nums text-cyan-pulse">
                  {fixture.awayTeam.homeAdvantage.toFixed(2)}
                </span>
              </div>
              <ConfidenceBar value={Math.min(fixture.awayTeam.homeAdvantage / 2, 1)} size="sm" showLabel={false} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
