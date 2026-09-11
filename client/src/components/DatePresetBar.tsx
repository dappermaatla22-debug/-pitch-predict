import { motion } from "framer-motion";

interface DatePresetBarProps {
  value: string;
  onChange: (date: string) => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0] || "";
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] || "";
}

function thisWeekend(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().split("T")[0] || "";
}

function thisWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().split("T")[0] || "";
}

const presets = [
  { label: "Today", get: today },
  { label: "Tomorrow", get: tomorrow },
  { label: "This Week", get: thisWeek },
  { label: "Weekend", get: thisWeekend },
];

export default function DatePresetBar({ value, onChange }: DatePresetBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange("")}
        className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          value === ""
            ? "text-midnight"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        {value === "" && (
          <motion.div
            layoutId="datePreset"
            className="absolute inset-0 rounded-lg bg-cyan-pulse"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <span className="relative">All</span>
      </button>
      {presets.map((p) => {
        const v: string = p.get();
        const active = value === v;
        return (
          <button
            key={p.label}
            onClick={() => onChange(v)}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              active ? "text-midnight" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {active && (
              <motion.div
                layoutId="datePreset"
                className="absolute inset-0 rounded-lg bg-cyan-pulse"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        );
      })}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field ml-1 text-xs"
      />
    </div>
  );
}
