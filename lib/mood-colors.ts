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

export const EMPTY_DAY_COLOR = "#f5f3ff";

export function moodColor(score: number | null | undefined): string {
  if (score == null || score < 1 || score > 10) return EMPTY_DAY_COLOR;
  return MOOD_COLORS[Math.round(score)] ?? EMPTY_DAY_COLOR;
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
