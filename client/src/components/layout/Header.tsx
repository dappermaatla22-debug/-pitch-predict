import { Link, useLocation } from "react-router-dom";
import SearchBar from "../SearchBar";

interface HeaderProps {
  onMenuToggle: () => void;
}

const navLinks = [
  { path: "/", label: "Dashboard" },
  { path: "/fixtures", label: "Fixtures" },
];

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-white/[0.06] bg-midnight/80 backdrop-blur-xl px-4 md:px-6">
      <button
        onClick={onMenuToggle}
        className="mr-3 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-carbon-elevated hover:text-white lg:hidden"
        aria-label="Toggle menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <Link to="/" className="flex items-center gap-1.5 shrink-0">
        <svg className="h-6 w-6 text-cyan-pulse" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.1" />
          <path d="M12 6l1.5 4 4 1-4 1.5L12 16l-1.5-4L6.5 11l4-1.5z" fill="currentColor" />
        </svg>
        <span className="font-heading text-base font-bold text-white hidden sm:inline">
          PITCH
          <span className="text-cyan-pulse"> PREDICT</span>
        </span>
      </Link>

      <nav className="ml-6 hidden items-center gap-1 lg:flex">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              location.pathname === link.path
                ? "bg-cyan-pulse/10 text-cyan-pulse"
                : "text-gray-400 hover:bg-carbon-elevated hover:text-gray-200"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto hidden w-64 md:block">
        <SearchBar />
      </div>

      <div className="ml-auto lg:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
