// Room colours: a soft background with a dark foreground of the same hue,
// so labels stay readable (contrast ≥ 4.5:1).
export const ROOM_COLORS = {
  coral: { bg: "#ffe4dc", fg: "#b4381a", solid: "#e8603c" },
  amber: { bg: "#fef1c7", fg: "#8a5a00", solid: "#f59e0b" },
  green: { bg: "#dcf5e6", fg: "#1d7a46", solid: "#22a35a" },
  sky: { bg: "#dbeefe", fg: "#1f5fa8", solid: "#3b82f6" },
  violet: { bg: "#ece6fe", fg: "#5b3cc4", solid: "#7c5ce6" },
  pink: { bg: "#fde2f0", fg: "#a3246b", solid: "#db4f97" },
  teal: { bg: "#d4f4ef", fg: "#0f6b61", solid: "#14b8a6" },
  indigo: { bg: "#eeebff", fg: "#4338ca", solid: "#4338ca" },
} as const;

export type RoomColor = keyof typeof ROOM_COLORS;

export function roomColor(key: string | null | undefined) {
  return ROOM_COLORS[(key as RoomColor) ?? "indigo"] ?? ROOM_COLORS.indigo;
}

// Bill line colours (dot next to each line).
export const LINE_COLORS = {
  rent: "#4338ca",
  electricity: "#f59e0b",
  wifi: "#0ea5e9",
  water: "#14b8a6",
  trash: "#84cc16",
  other: "#a855f7",
  adjustment: "#9ca3af",
} as const;

export const EXPENSE_LABELS = {
  wifi: "Wifi",
  water: "Nước",
  trash: "Rác",
  other: "Khác",
} as const;
