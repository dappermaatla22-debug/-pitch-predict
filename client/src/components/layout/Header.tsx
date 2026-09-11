import { Link, useLocation } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/fixtures", label: "Fixtures" },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="flex h-14 items-center border-b border-carbon-elevated bg-carbon px-6">
      <Link to="/" className="mr-8">
        <h1 className="font-heading text-lg font-bold tracking-tight text-white">
          Pitch<span className="text-cyan-pulse">Predict</span>
        </h1>
      </Link>
      <nav className="flex gap-1">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              location.pathname === item.to
                ? "bg-cyan-pulse/10 text-cyan-pulse"
                : "text-gray-400 hover:bg-carbon-elevated hover:text-gray-200"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
