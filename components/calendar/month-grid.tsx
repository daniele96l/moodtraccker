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
import type { DayTodoSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MonthGridProps {
  year: number;
  month: number;
  moods: Record<string, number | null>;
  meditatedDays: Record<string, boolean>;
  planDays: Record<string, DayTodoSummary>;
  onDayClick: (dateKey: string) => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEK_OPTS = { weekStartsOn: 1 as const };

export function MonthGrid({
  year,
  month,
  moods,
  meditatedDays,
  planDays,
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
      <div className="grid grid-cols-7 justify-items-center gap-1 overflow-visible">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthStart);
          const score = moods[dateKey] ?? null;
          const isToday = isSameDay(day, today);
          const meditated = meditatedDays[dateKey];
          const plan = planDays[dateKey];
          const hasPlan = !!plan && plan.total > 0;
          const planLabel = plan?.preview
            ? ` — ${plan.preview}`
            : plan
              ? ` — ${plan.total} calendar item${plan.total > 1 ? "s" : ""}`
              : "";

          return (
            <button
              key={dateKey}
              id={isToday ? "calendar-today" : undefined}
              type="button"
              disabled={!inMonth}
              onClick={() => inMonth && onDayClick(dateKey)}
              className={cn(
                "relative flex aspect-square w-full max-w-[40px] items-center justify-center overflow-visible rounded-md transition-transform active:scale-95",
                isToday && "scroll-mt-32",
                !inMonth && "invisible pointer-events-none",
                inMonth && "cursor-pointer hover:ring-2 hover:ring-primary/25 hover:shadow-sm",
                isToday && "font-semibold ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-sm"
              )}
              style={{ backgroundColor: moodColor(score, isDark) }}
              aria-label={
                meditated
                  ? `${format(day, "MMMM d, yyyy")} — meditated${planLabel}`
                  : `${format(day, "MMMM d, yyyy")}${planLabel}`
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
              {hasPlan && inMonth && (
                <span
                  className="absolute bottom-0.5 left-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-background"
                  title={
                    plan.preview ??
                    `${plan.total} calendar item${plan.total > 1 ? "s" : ""}`
                  }
                />
              )}
              {meditated && inMonth && (
                <span
                  className="absolute bottom-0.5 right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-primary/50"
                  title="Meditated"
                >
                  <Flower2
                    className="h-2.5 w-2.5 text-primary"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
