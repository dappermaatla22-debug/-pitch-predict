interface LeagueBadgeProps {
  name: string;
  logoUrl?: string | null;
  active?: boolean;
  onClick?: () => void;
}

export default function LeagueBadge({
  name,
  logoUrl,
  active = false,
  onClick,
}: LeagueBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
        active
          ? "border border-cyan-pulse/30 bg-cyan-pulse/10 text-cyan-pulse"
          : "border border-white/10 bg-carbon-elevated text-gray-400 hover:border-white/20 hover:text-gray-200"
      }`}
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt={name}
          className="h-3.5 w-3.5 rounded-sm object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      {name}
    </button>
  );
}
