import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import { formatDate, formatConfidence, formatScore } from "../lib/format.ts";
import type { Fixture } from "../types/index.ts";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.fixtures
      .get(parseInt(id))
      .then(setFixture)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-lg bg-carbon-elevated" />
        <div className="h-64 animate-pulse rounded-lg bg-carbon-elevated" />
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="rounded-lg border border-carbon-elevated bg-carbon p-12 text-center">
        <p className="text-gray-500">Match not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/fixtures"
        className="text-sm text-cyan-pulse hover:underline"
      >
        ← Back to fixtures
      </Link>

      <div className="rounded-lg border border-carbon-elevated bg-carbon p-6">
        <div className="text-xs text-gray-500 mb-4">
          {fixture.league.name} · {formatDate(fixture.date)}
          {fixture.time && ` · ${fixture.time}`}
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-right">
            <div className="font-heading text-xl font-bold text-white">
              {fixture.homeTeam.shortName || fixture.homeTeam.name}
            </div>
          </div>
          <div className="font-heading text-3xl font-bold text-gray-500">
            {formatScore(fixture.homeScore, fixture.awayScore)}
          </div>
          <div className="text-left">
            <div className="font-heading text-xl font-bold text-white">
              {fixture.awayTeam.shortName || fixture.awayTeam.name}
            </div>
          </div>
        </div>
        {fixture.venue && (
          <div className="mt-3 text-center text-xs text-gray-600">
            {fixture.venue}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-carbon-elevated bg-carbon p-6">
        <h3 className="font-heading text-lg font-bold text-white mb-4">
          Predictions
        </h3>
        {fixture.predictions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No predictions generated for this match yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fixture.predictions.map((pred) => (
              <div
                key={pred.id}
                className="rounded-md border border-carbon-elevated bg-carbon-elevated p-4"
              >
                <div className="mb-2 text-xs font-medium text-gray-500 uppercase">
                  {pred.market}
                </div>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`font-heading text-lg font-bold ${
                      pred.confidence >= 0.7
                        ? "text-prime"
                        : pred.confidence >= 0.5
                          ? "text-cyan-pulse"
                          : "text-gray-300"
                    }`}
                  >
                    {pred.topPick}
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatConfidence(pred.confidence)}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries(pred.probabilities).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-gray-500">{key}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-midnight">
                        <div
                          className="h-full rounded-full bg-cyan-pulse"
                          style={{ width: `${(val as number) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-gray-400">
                        {formatConfidence(val as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
