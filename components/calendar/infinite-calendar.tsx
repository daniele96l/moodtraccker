"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DaySheet } from "@/components/day/day-sheet";
import { TodayQuickActions } from "@/components/habits/today-quick-actions";
import { useMonthMoods } from "@/lib/hooks/use-month-moods";
import { formatMonthLabel } from "@/lib/date-utils";

interface MonthBlockProps {
  year: number;
  month: number;
  refreshKey: number;
  onDayClick: (dateKey: string) => void;
  onVisible?: () => void;
}

function MonthBlock({ year, month, refreshKey, onDayClick, onVisible }: MonthBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { moods, loading } = useMonthMoods(year, month, refreshKey);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div ref={ref} className="scroll-mt-4 px-4 py-5">
      <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground/80">
        {formatMonthLabel(year, month)}
      </h2>
      {loading ? (
        <div className="flex h-44 items-center justify-center">
          <div className="h-6 w-6 animate-pulse rounded-full bg-primary/15" />
        </div>
      ) : (
        <MonthGrid
          year={year}
          month={month}
          moods={moods}
          onDayClick={onDayClick}
        />
      )}
    </div>
  );
}

function buildMonthList(centerYear: number, centerMonth: number, count: number) {
  const months: { year: number; month: number }[] = [];
  const half = Math.floor(count / 2);
  for (let i = -half; i <= half; i++) {
    const d = new Date(centerYear, centerMonth + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
}

export function InfiniteCalendar() {
  const now = new Date();
  const [months, setMonths] = useState(() =>
    buildMonthList(now.getFullYear(), now.getMonth(), 5)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const topSentinel = useRef<HTMLDivElement>(null);
  const bottomSentinel = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  const loadPast = useCallback(() => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    setMonths((prev) => {
      const first = prev[0];
      const newMonths: { year: number; month: number }[] = [];
      for (let i = 3; i >= 1; i--) {
        const d = new Date(first.year, first.month - i, 1);
        newMonths.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return [...newMonths, ...prev];
    });
    setTimeout(() => {
      loadingMore.current = false;
    }, 300);
  }, []);

  const loadFuture = useCallback(() => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    setMonths((prev) => {
      const last = prev[prev.length - 1];
      const newMonths: { year: number; month: number }[] = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(last.year, last.month + i, 1);
        newMonths.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return [...prev, ...newMonths];
    });
    setTimeout(() => {
      loadingMore.current = false;
    }, 300);
  }, []);

  useEffect(() => {
    const top = topSentinel.current;
    const bottom = bottomSentinel.current;
    if (!top || !bottom) return;

    const topObs = new IntersectionObserver(
      ([e]) => e.isIntersecting && loadPast(),
      { rootMargin: "100px" }
    );
    const bottomObs = new IntersectionObserver(
      ([e]) => e.isIntersecting && loadFuture(),
      { rootMargin: "100px" }
    );
    topObs.observe(top);
    bottomObs.observe(bottom);
    return () => {
      topObs.disconnect();
      bottomObs.disconnect();
    };
  }, [loadPast, loadFuture]);

  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-lg">
        <header className="sticky top-0 z-10 border-b border-border/40 bg-background/75 px-5 py-5 backdrop-blur-xl">
          <h1 className="text-center text-xl font-medium tracking-tight text-foreground">
            Mood
          </h1>
          <p className="mt-0.5 text-center text-xs text-muted-foreground">
            Tap a day · scroll for more months
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {[1, 3, 5, 7, 10].map((s) => (
              <div
                key={s}
                className="h-2.5 w-2.5 rounded-md shadow-sm"
                style={{
                  backgroundColor:
                    s === 1
                      ? "#f9d5e5"
                      : s === 3
                        ? "#f0d4c8"
                        : s === 5
                          ? "#e8e4f0"
                          : s === 7
                            ? "#d4ebe4"
                            : "#b8e8c8",
                }}
                title={`Mood ${s}`}
              />
            ))}
          </div>
          <TodayQuickActions />
        </header>

        <div ref={topSentinel} className="h-1" />

        {months.map(({ year, month }) => (
          <MonthBlock
            key={`${year}-${month}`}
            year={year}
            month={month}
            refreshKey={refreshKey}
            onDayClick={handleDayClick}
          />
        ))}

        <div ref={bottomSentinel} className="h-1" />
      </div>

      {selectedDate && (
        <DaySheet
          dateKey={selectedDate}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
