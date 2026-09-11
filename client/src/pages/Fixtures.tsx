import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.ts";
import { formatDate, formatScore, formatConfidence } from "../lib/format.ts";
import type { Fixture, League } from "../types/index.ts";

const PAGE_SIZE = 50;

export default function Fixtures() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  const leagueFilter = searchParams.get("league") || "";
  const dateFilter = searchParams.get("date") || "";
  const confidenceFilter = searchParams.get("minConfidence") || "";

  useEffect(() => {
    api.leagues.list().then(setLeagues).catch(console.error);
  }, []);

  const loadFixtures = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (leagueFilter) params.league = leagueFilter;
    if (dateFilter) params.date = dateFilter;
    params.limit = String(PAGE_SIZE);
    params.offset = String((page - 1) * PAGE_SIZE);

    api.fixtures
      .list(params)
      .then((res: any) => {
        setFixtures(res.fixtures || res);
        setTotal(res.total || (res.fixtures || res).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueFilter, dateFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [leagueFilter, dateFilter]);

  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

  const filtered = confidenceFilter
    ? fixtures.filter((f) =>
        f.predictions.some(
          (p) => p.confidence >= parseFloat(confidenceFilter),
        ),
      )
    : fixtures;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-white mb-6">
        Fixtures
      </h2>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={leagueFilter}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set("league", e.target.value);
            else p.delete("league");
            setSearchParams(p);
          }}
          className="rounded-md border border-carbon-elevated bg-carbon px-3 py-1.5 text-sm text-gray-300 focus:border-cyan-pulse focus:outline-none"
        >
          <option value="">All leagues</option>
          {leagues.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set("date", e.target.value);
            else p.delete("date");
            setSearchParams(p);
          }}
          className="rounded-md border border-carbon-elevated bg-carbon px-3 py-1.5 text-sm text-gray-300 focus:border-cyan-pulse focus:outline-none"
        />

        <select
          value={confidenceFilter}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set("minConfidence", e.target.value);
            else p.delete("minConfidence");
            setSearchParams(p);
          }}
          className="rounded-md border border-carbon-elevated bg-carbon px-3 py-1.5 text-sm text-gray-300 focus:border-cyan-pulse focus:outline-none"
        >
          <option value="">Any confidence</option>
          <option value="0.5">50%+ only</option>
          <option value="0.6">60%+ only</option>
          <option value="0.7">70%+ only</option>
        </select>

        <span className="self-center text-xs text-gray-500">
          {total} total fixtures
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-carbon-elevated"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-carbon-elevated bg-carbon p-12 text-center">
          <p className="text-gray-500">No fixtures match your filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map((fixture) => (
              <Link
                key={fixture.id}
                to={`/match/${fixture.id}`}
                className="flex items-center gap-4 rounded-lg border border-carbon-elevated bg-carbon p-4 transition-colors hover:border-cyan-pulse/30 hover:bg-carbon-elevated"
              >
                <div className="min-w-[140px] text-xs text-gray-500">
                  <div>{formatDate(fixture.date)}</div>
                  <div>{fixture.league.name}</div>
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
                <div className="text-sm text-gray-500 w-20 text-right">
                  {formatScore(fixture.homeScore, fixture.awayScore)}
                </div>
                <div className="w-16 text-right font-heading text-sm font-bold text-cyan-pulse">
                  {fixture.predictions.length > 0
                    ? formatConfidence(
                        Math.max(
                          ...fixture.predictions.map((p) => p.confidence),
                        ),
                      )
                    : "—"}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-carbon-elevated bg-carbon px-3 py-1.5 text-sm text-gray-400 hover:bg-carbon-elevated disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-carbon-elevated bg-carbon px-3 py-1.5 text-sm text-gray-400 hover:bg-carbon-elevated disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
