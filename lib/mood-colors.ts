const MOOD_COLORS: Record<number, string> = {
  1: "#f9d5e5",
  2: "#f5c6d6",
  3: "#f0d4c8",
  4: "#f5e6c8",
  5: "#e8e4f0",
  6: "#dce8f0",
  7: "#d4ebe4",
  8: "#c8e8d8",
  9: "#c0e8d0",
  10: "#b8e8c8",
};

const DARK_MOOD_COLORS: Record<number, string> = {
  1: "#4a3542",
  2: "#4d3845",
  3: "#52403c",
  4: "#55463c",
  5: "#4a4554",
  6: "#424f58",
  7: "#3d524c",
  8: "#38554a",
  9: "#35574c",
  10: "#325a4e",
};

export const EMPTY_DAY_COLOR = "#f5f3ff";
export const DARK_EMPTY_DAY_COLOR = "#34323f";

export function moodColor(
  score: number | null | undefined,
  isDark = false
): string {
  const empty = isDark ? DARK_EMPTY_DAY_COLOR : EMPTY_DAY_COLOR;
  if (score == null || score < 1 || score > 10) return empty;
  const palette = isDark ? DARK_MOOD_COLORS : MOOD_COLORS;
  return palette[Math.round(score)] ?? empty;
}

export const MOOD_LABELS: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Down",
  4: "Meh",
  5: "Neutral",
  6: "Okay",
  7: "Good",
  8: "Great",
  9: "Happy",
  10: "Amazing",
};
