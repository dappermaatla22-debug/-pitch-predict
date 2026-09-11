import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import AIPickCard from "../components/AIPickCard";
import MatchCard from "../components/MatchCard";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { SkeletonPickList, SkeletonList } from "../components/LoadingSkeleton";
import type { Prediction, BestPick } from "../types";

export default function Dashboard() {
  const [bestPicks, setBestPicks] = useState<BestPick[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    withResults: number;
    correct: number;
    accuracy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      api.predictions.bestPicks(today, 6).catch(() => []),
      api.predictions.top({ limit: "20", status: "upcoming" }).catch(() => []),
      api.predictions.accuracy().catch(() => null),
    ]).then(([picks, preds, acc]) => {
      setBestPicks(picks);
      setPredictions(preds);
      setStats(acc);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-heading text-2xl font-bold text-white md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          AI-powered football predictions updated in real-time
        </p>
      </motion.div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-cyan-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          <h2 className="font-heading text-lg font-semibold text-white">
            PITCH PREDICT AI
          </h2>
          <span className="badge-prime">Best Picks Today</span>
        </div>

        {loading ? (
          <SkeletonPickList count={3} />
        ) : bestPicks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bestPicks.map((pick, i) => (
              <motion.div
                key={pick.fixture.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <AIPickCard pick={pick} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No picks for today"
            description="PITCH PREDICT AI is analyzing today's fixtures. Check back closer to kick-off times."
          />
        )}
      </div>

      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4"
        >
          <StatCard label="Model Accuracy" value={Math.round(stats.accuracy * 100)} suffix="%" color="win" />
          <StatCard label="Total Predictions" value={stats.total} color="cyan" />
          <StatCard label="Fixtures Analyzed" value={stats.withResults} color="prime" />
          <StatCard label="Correct Picks" value={stats.correct} color="gray" />
        </motion.div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-white">
            Upcoming Predictions
          </h2>
        </div>

        {loading ? (
          <SkeletonList count={5} />
        ) : predictions.length > 0 ? (
          <div className="space-y-2">
            {predictions.map((pred, i) => (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {pred.fixture && <MatchCard fixture={pred.fixture} />}
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming predictions"
            description="PITCH PREDICT AI hasn't generated predictions for upcoming fixtures yet."
          />
        )}
      </div>
    </div>
  );
}
