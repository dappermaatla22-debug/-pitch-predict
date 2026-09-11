export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  return time.replace(/\s*\(.*\)/, "");
}

export function formatConfidence(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}

export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return "TBD";
  return `${home} – ${away}`;
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
