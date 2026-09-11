import { motion } from "framer-motion";

interface ConfidenceBarProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getColor(pct: number): string {
  if (pct >= 70) return "bg-win";
  if (pct >= 55) return "bg-cyan-pulse";
  if (pct >= 40) return "bg-prime";
  return "bg-loss";
}

function getGlowColor(pct: number): string {
  if (pct >= 70) return "shadow-[0_0_8px_rgba(34,197,94,0.3)]";
  if (pct >= 55) return "shadow-[0_0_8px_rgba(34,211,238,0.3)]";
  if (pct >= 40) return "shadow-[0_0_8px_rgba(251,191,36,0.3)]";
  return "shadow-[0_0_8px_rgba(239,68,68,0.3)]";
}

const heightMap = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

export default function ConfidenceBar({
  value,
  size = "md",
  showLabel = true,
}: ConfidenceBarProps) {
  const pct = Math.round(value * 100);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${heightMap[size]} flex-1 overflow-hidden rounded-full bg-carbon-elevated`}
      >
        <motion.div
          className={`${getColor(pct)} ${getGlowColor(pct)} h-full rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      {showLabel && (
        <span
          className={`min-w-[38px] text-right text-xs font-semibold tabular-nums ${
            pct >= 70
              ? "text-win"
              : pct >= 55
                ? "text-cyan-pulse"
                : pct >= 40
                  ? "text-prime"
                  : "text-loss"
          }`}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}
