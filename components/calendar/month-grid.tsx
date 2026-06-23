"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Flower2 } from "lucide-react";
import { moodColor } from "@/lib/mood-colors";
import { useTheme } from "@/lib/hooks/use-theme";
import { cn } from "@/lib/utils";

interface MonthGridProps {
  year: number;
  month: number;
  moods: Record<string, number | null>;
  meditatedDays: Record<string, boolean>;
  onDayClick: (dateKey: string) => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEK_OPTS = { weekStartsOn: 1 as const };

export function MonthGrid({
  year,
  month,
  moods,
  meditatedDays,
  onDayClick,
}: MonthGridProps) {
  const isDark = useTheme() === "dark";
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 justify-items-center gap-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthStart);
          const score = moods[dateKey] ?? null;
          const isToday = isSameDay(day, today);
          const meditated = meditatedDays[dateKey];

          return (
            <button
              key={dateKey}
              id={isToday ? "calendar-today" : undefined}
              type="button"
              disabled={!inMonth}
              onClick={() => inMonth && onDayClick(dateKey)}
              className={cn(
                "relative flex aspect-square w-full max-w-[40px] items-center justify-center rounded-md transition-transform active:scale-95",
                isToday && "scroll-mt-32",
                !inMonth && "invisible pointer-events-none",
                inMonth && "cursor-pointer hover:ring-2 hover:ring-primary/25 hover:shadow-sm",
                isToday && "font-semibold ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-sm"
              )}
              style={{ backgroundColor: moodColor(score, isDark) }}
              aria-label={
                meditated
                  ? `${format(day, "MMMM d, yyyy")} — meditated`
                  : format(day, "MMMM d, yyyy")
              }
            >
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  isDark ? "text-white/75" : "text-foreground/70",
                  isToday && (isDark ? "text-white" : "text-foreground")
                )}
              >
                {format(day, "d")}
              </span>
              {meditated && inMonth && (
                <span
                  className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background/90 shadow-sm ring-1 ring-primary/20"
                  title="Meditated"
                >
                  <Flower2 className="h-2 w-2 text-primary/75" strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
