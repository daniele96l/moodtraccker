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
import { moodColor } from "@/lib/mood-colors";
import { cn } from "@/lib/utils";

interface MonthGridProps {
  year: number;
  month: number;
  moods: Record<string, number | null>;
  onDayClick: (dateKey: string) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthGrid({ year, month, moods, onDayClick }: MonthGridProps) {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthStart);
          const score = moods[dateKey] ?? null;
          const isToday = isSameDay(day, today);

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!inMonth}
              onClick={() => inMonth && onDayClick(dateKey)}
              className={cn(
                "aspect-square w-full max-w-[40px] rounded-md transition-transform active:scale-95",
                !inMonth && "invisible pointer-events-none",
                inMonth && "cursor-pointer hover:ring-2 hover:ring-violet-200",
                isToday && "ring-2 ring-violet-400 ring-offset-1"
              )}
              style={{ backgroundColor: moodColor(score) }}
              aria-label={format(day, "MMMM d, yyyy")}
            />
          );
        })}
      </div>
    </div>
  );
}
