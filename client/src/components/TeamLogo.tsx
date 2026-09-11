import { useState } from "react";

interface TeamLogoProps {
  url: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-lg",
};

const fallbackColors = [
  "bg-cyan-pulse/20 text-cyan-pulse",
  "bg-prime/20 text-prime",
  "bg-win/20 text-win",
  "bg-loss/20 text-loss",
  "bg-purple-500/20 text-purple-400",
  "bg-blue-500/20 text-blue-400",
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getColorClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % fallbackColors.length;
  return fallbackColors[idx] as string;
}

export default function TeamLogo({ url, name, size = "md" }: TeamLogoProps) {
  const [imgError, setImgError] = useState(false);
  const showImg = url && !imgError;

  if (showImg) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeMap[size] || sizeMap.md} rounded-full object-contain bg-carbon-elevated`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size] || sizeMap.md} ${getColorClass(name)} flex items-center justify-center rounded-full font-heading font-bold select-none`}
    >
      {getInitials(name)}
    </div>
  );
}
