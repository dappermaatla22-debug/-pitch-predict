import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const confederations = [
  {
    name: "UEFA",
    leagues: [
      { slug: "premier-league", name: "Premier League", country: "England" },
      { slug: "la-liga", name: "La Liga", country: "Spain" },
      { slug: "serie-a", name: "Serie A", country: "Italy" },
      { slug: "bundesliga", name: "Bundesliga", country: "Germany" },
      { slug: "ligue-1", name: "Ligue 1", country: "France" },
      { slug: "eredivisie", name: "Eredivisie", country: "Netherlands" },
      { slug: "primeira-liga", name: "Primeira Liga", country: "Portugal" },
      { slug: "scottish-premiership", name: "Scottish Premiership", country: "Scotland" },
      { slug: "champions-league", name: "Champions League", country: "Europe" },
      { slug: "europa-league", name: "Europa League", country: "Europe" },
    ],
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ UEFA: true });
  const location = useLocation();

  return (
    <aside className="flex w-[280px] flex-col border-r border-carbon-elevated bg-carbon">
      <div className="flex-1 overflow-y-auto p-4">
        {confederations.map((conf) => (
          <div key={conf.name} className="mb-4">
            <button
              onClick={() => setOpen((o) => ({ ...o, [conf.name]: !o[conf.name] }))}
              className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-carbon-elevated hover:text-gray-300"
            >
              {conf.name}
              <span className="text-[10px]">{open[conf.name] ? "▼" : "▶"}</span>
            </button>
            {open[conf.name] && (
              <div className="ml-1 space-y-0.5">
                {conf.leagues.map((league) => (
                  <Link
                    key={league.slug}
                    to={`/fixtures?league=${league.slug}`}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                      location.search.includes(league.slug)
                        ? "bg-cyan-pulse/10 text-cyan-pulse"
                        : "text-gray-400 hover:bg-carbon-elevated hover:text-gray-200"
                    }`}
                  >
                    <span>{league.name}</span>
                    <span className="text-[10px] text-gray-600">{league.country}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
