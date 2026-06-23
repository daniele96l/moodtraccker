import { format, parseISO, subDays } from "date-fns";
import type { Habit, HabitKind } from "@/lib/types";

export function isStreakDay(
  kind: HabitKind,
  completed: boolean | undefined
): boolean | null {
  if (completed === undefined) return null;
  if (kind === "habit") return completed;
  return completed;
}

export function isHabitSuccess(kind: HabitKind, completed: boolean): boolean {
  return kind === "habit" ? completed : completed;
}

export function habitDisplayLabel(
  kind: HabitKind,
  completed: boolean | undefined
): string {
  if (kind === "habit") {
    if (completed === undefined) return "Not done";
    return completed ? "Done" : "Not done";
  }
  if (completed === undefined) return "Not logged";
  return completed ? "Avoided" : "Slipped";
}

export function getHabitStreak(
  habitId: string,
  kind: HabitKind,
  logs: { habit_id: string; log_date: string; completed: boolean }[],
  asOfDate: string
): number {
  let streak = 0;
  let day = parseISO(asOfDate);

  for (let i = 0; i < 400; i++) {
    const dateKey = format(day, "yyyy-MM-dd");
    const log = logs.find(
      (l) => l.habit_id === habitId && l.log_date === dateKey
    );

    if (kind === "habit") {
      if (log?.completed) streak++;
      else break;
    } else if (log?.completed === true) {
      streak++;
    } else {
      break;
    }

    day = subDays(day, 1);
  }

  return streak;
}

export const HABIT_PRESETS = [
  "Exercise",
  "Read",
  "Meditate",
  "Drink water",
  "Sleep 8h",
];

export const VICE_PRESETS = [
  "Social media",
  "Junk food",
  "Smoking",
  "Alcohol",
  "Late night scroll",
];
