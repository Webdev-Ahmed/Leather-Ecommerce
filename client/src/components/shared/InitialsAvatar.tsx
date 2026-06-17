import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

type InitialsAvatarProps = {
  name: string;
  size?: number;
  className?: string;
};

// Deterministic colour from name — maps to 8 brand-safe hues
const BG_COLOURS = [
  "#2D2D2D", // near-black
  "#8B6914", // dark gold
  "#4A5568", // slate
  "#2C5282", // navy
  "#276749", // forest
  "#702459", // plum
  "#744210", // amber
  "#1A365D", // midnight
];

function getBgColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLOURS[Math.abs(hash) % BG_COLOURS.length];
}

export function InitialsAvatar({
  name,
  size = 32,
  className,
}: InitialsAvatarProps) {
  const initials = getInitials(name);
  const bg = getBgColour(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Avatar for ${name}`}
      role="img"
      className={cn("rounded-full shrink-0", className)}
    >
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={bg} />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={fontSize}
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fontWeight="500"
        letterSpacing="0.05em"
      >
        {initials}
      </text>
    </svg>
  );
}
