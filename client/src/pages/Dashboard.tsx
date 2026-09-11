import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import { formatConfidence, formatDate, formatScore } from "../lib/format.ts";
import type { Prediction } from "../types/index.ts";

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.predictions
      .top({ limit: "50" })
      .then(setPredictions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-white mb-6">
        Top Predictions
      </h2>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-carbon-elevated"
            />
          ))}
        </div>
      )}

      {!loading && predictions.length === 0 && (
        <div className="rounded-lg border border-carbon-elevated bg-carbon p-12 text-center">
          <p className="text-gray-500">
            No predictions yet. Run the prediction engine to generate picks.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {predictions.map((pred) => {
          const fixture = pred.fixture;
          if (!fixture) return null;
          return (
            <Link
              key={pred.id}
              to={`/match/${fixture.id}`}
              className="flex items-center gap-4 rounded-lg border border-carbon-elevated bg-carbon p-4 transition-colors hover:border-cyan-pulse/30 hover:bg-carbon-elevated"
            >
              <div className="min-w-[160px] text-xs text-gray-500">
                {formatDate(fixture.date)}
                {fixture.time && (
                  <span className="ml-2">{fixture.time}</span>
                )}
              </div>
              <div className="flex flex-1 items-center gap-3">
                <span className="font-medium text-white">
                  {fixture.homeTeam.shortName || fixture.homeTeam.name}
                </span>
                <span className="text-gray-600">vs</span>
                <span className="font-medium text-white">
                  {fixture.awayTeam.shortName || fixture.awayTeam.name}
                </span>
              </div>
              <div className="text-xs text-gray-500 w-20 text-right">
                {formatScore(fixture.homeScore, fixture.awayScore)}
              </div>
              <div className="w-24 text-center">
                <span className="text-xs font-medium text-gray-400">
                  {pred.market}
                </span>
                <div className="text-sm font-semibold text-cyan-pulse">
                  {pred.topPick}
                </div>
              </div>
              <div
                className={`w-16 text-right font-heading text-lg font-bold ${
                  pred.confidence >= 0.7
                    ? "text-prime"
                    : pred.confidence >= 0.5
                      ? "text-cyan-pulse"
                      : "text-gray-400"
                }`}
              >
                {formatConfidence(pred.confidence)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
