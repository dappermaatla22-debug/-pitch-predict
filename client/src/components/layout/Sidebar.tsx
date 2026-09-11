import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import type { League } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const location = useLocation();

  useEffect(() => {
    api.leagues.list().then(setLeagues).catch(() => {});
  }, []);

  const content = (
    <div className="flex h-full flex-col bg-carbon lg:bg-transparent">
      <div className="p-4 border-b border-white/[0.06] lg:hidden">
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-bold text-white">
            Leagues
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-carbon-elevated hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            location.pathname === "/"
              ? "bg-cyan-pulse/10 text-cyan-pulse"
              : "text-gray-400 hover:bg-carbon-elevated hover:text-gray-200"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Dashboard
        </Link>
        <Link
          to="/fixtures"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            location.pathname === "/fixtures"
              ? "bg-cyan-pulse/10 text-cyan-pulse"
              : "text-gray-400 hover:bg-carbon-elevated hover:text-gray-200"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Fixtures
        </Link>

        <div className="pt-4 pb-2 px-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            Leagues
          </div>
        </div>

        {leagues.map((league) => (
          <Link
            key={league.id}
            to={`/fixtures?league=${league.slug}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-all hover:bg-carbon-elevated hover:text-gray-200"
          >
            {league.logoUrl ? (
              <img
                src={league.logoUrl}
                alt={league.name}
                className="h-4 w-4 rounded-sm object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-4 w-4 rounded-sm bg-carbon-elevated" />
            )}
            <span className="truncate">{league.name}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="text-[11px] text-gray-600">
          Pitch Predict v1.0
        </div>
        <div className="text-[10px] text-gray-700 mt-0.5">
          Powered by Dixon-Coles Model
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-white/[0.06]">
        {content}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
