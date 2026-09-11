import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import MatchCard from "../components/MatchCard";
import DatePresetBar from "../components/DatePresetBar";
import LeagueBadge from "../components/LeagueBadge";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/LoadingSkeleton";
import type { League, Fixture } from "../types";

export default function Fixtures() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const league = searchParams.get("league") || "";
  const date = searchParams.get("date") || "";
  const status = searchParams.get("status") || "upcoming";
  const page = parseInt(searchParams.get("page") || "1");
  const PAGE_SIZE = 30;

  useEffect(() => {
    api.leagues.list().then(setLeagues).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {
      limit: String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE),
      status: status,
    };
    if (league) params.league = league;
    if (date) params.date = date;

    api.fixtures.list(params).then((res) => {
      if ("fixtures" in res) {
        setFixtures(res.fixtures);
        setTotal(res.total);
      }
      setLoading(false);
    }).catch(() => {
      setFixtures([]);
      setTotal(0);
      setLoading(false);
    });
  }, [league, date, status, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams);
    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    p.delete("page");
    setSearchParams(p);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-heading text-2xl font-bold text-white md:text-3xl">
          Fixtures
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} {status === "upcoming" ? "upcoming" : status === "finished" ? "completed" : ""} fixtures
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <DatePresetBar
          value={date}
          onChange={(d) => setParam("date", d)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setParam("status", "upcoming")}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              status === "upcoming" ? "text-midnight" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {status === "upcoming" && (
              <motion.div
                layoutId="statusTab"
                className="absolute inset-0 rounded-lg bg-cyan-pulse"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">Upcoming</span>
          </button>
          <button
            onClick={() => setParam("status", "finished")}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              status === "finished" ? "text-midnight" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {status === "finished" && (
              <motion.div
                layoutId="statusTab"
                className="absolute inset-0 rounded-lg bg-cyan-pulse"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">Finished</span>
          </button>
          <button
            onClick={() => setParam("status", "")}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              status === "" ? "text-midnight" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {status === "" && (
              <motion.div
                layoutId="statusTab"
                className="absolute inset-0 rounded-lg bg-cyan-pulse"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">All</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <LeagueBadge
            name="All"
            active={!league}
            onClick={() => setParam("league", "")}
          />
          {leagues.map((l) => (
            <LeagueBadge
              key={l.id}
              name={l.name}
              logoUrl={l.logoUrl}
              active={league === l.slug}
              onClick={() => setParam("league", l.slug)}
            />
          ))}
        </div>
      </motion.div>

      {loading ? (
        <SkeletonList count={8} />
      ) : fixtures.length > 0 ? (
        <div className="space-y-2">
          {fixtures.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
            >
              <MatchCard fixture={f} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No fixtures found"
          description="Try adjusting your filters or date range."
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setParam("page", String(page - 1))}
            disabled={page <= 1}
            className="btn-secondary disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setParam("page", String(page + 1))}
            disabled={page >= totalPages}
            className="btn-secondary disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
