import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  color?: "cyan" | "prime" | "win" | "gray";
  icon?: React.ReactNode;
}

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

const colorMap = {
  cyan: "from-cyan-pulse/10 to-cyan-pulse/5 border-cyan-pulse/20 text-cyan-pulse",
  prime: "from-prime/10 to-prime/5 border-prime/20 text-prime",
  win: "from-win/10 to-win/5 border-win/20 text-win",
  gray: "from-white/5 to-white/[0.02] border-white/10 text-gray-400",
};

export default function StatCard({
  label,
  value,
  suffix = "",
  color = "cyan",
  icon,
}: StatCardProps) {
  const { count, ref } = useCountUp(value);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`glass-card bg-gradient-to-br ${colorMap[color]} p-4`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`font-heading text-2xl font-bold tabular-nums`}>
            {count.toLocaleString()}
            {suffix}
          </div>
          <div className="mt-0.5 text-xs text-gray-400">{label}</div>
        </div>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
    </motion.div>
  );
}
