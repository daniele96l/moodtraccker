"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonthGrid } from "@/components/calendar/month-grid";
import { TodayQuickActions } from "@/components/habits/today-quick-actions";
import { useMonthMoods } from "@/lib/hooks/use-month-moods";
import { formatMonthLabel, toDateKey } from "@/lib/date-utils";
import type { DayTab } from "@/lib/types";
import { Calendar, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface InfiniteCalendarProps {
  onOpenDay: (dateKey: string, tab?: DayTab) => void;
  refreshKey: number;
  inboxOpen?: boolean;
  scheduleOpen?: boolean;
  onToggleInbox?: () => void;
  onToggleSchedule?: () => void;
}

interface MonthBlockProps {
  year: number;
  month: number;
  refreshKey: number;
  onDayClick: (dateKey: string) => void;
}

function MonthBlock({ year, month, refreshKey, onDayClick }: MonthBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { moods, meditatedDays, planDays, loading } = useMonthMoods(year, month, refreshKey);
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  return (
    <div
      ref={ref}
      id={isCurrentMonth ? "month-current" : `month-${year}-${month}`}
      data-month-block
      data-year={year}
      data-month={month}
      className="scroll-mt-4 px-4 py-5"
    >
      <h2
        className="sticky z-[9] -mx-4 mb-3 border-b border-border/40 bg-background/90 px-4 py-2.5 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground backdrop-blur-md"
        style={{ top: "var(--calendar-header-offset, 8.5rem)" }}
      >
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
          meditatedDays={meditatedDays}
          planDays={planDays}
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

export function InfiniteCalendar({
  onOpenDay,
  refreshKey,
  inboxOpen = false,
  scheduleOpen = false,
  onToggleInbox,
  onToggleSchedule,
}: InfiniteCalendarProps) {
  const { signOut } = useAuth();
  const now = new Date();
  const [months, setMonths] = useState(() =>
    buildMonthList(now.getFullYear(), now.getMonth(), 5)
  );
  const headerRef = useRef<HTMLElement>(null);
  const topSentinel = useRef<HTMLDivElement>(null);
  const bottomSentinel = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);
  const hasScrolledToToday = useRef(false);

  const scrollToToday = useCallback((behavior: ScrollBehavior = "smooth") => {
    const todayEl = document.getElementById("calendar-today");
    if (todayEl) {
      todayEl.scrollIntoView({ block: "center", behavior });
      return true;
    }
    const monthEl = document.getElementById("month-current");
    if (monthEl) {
      monthEl.scrollIntoView({ block: "start", behavior });
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (hasScrolledToToday.current) return;

    const tryScroll = () => {
      if (scrollToToday("instant")) {
        hasScrolledToToday.current = true;
      }
    };

    tryScroll();
    const t1 = window.setTimeout(tryScroll, 100);
    const t2 = window.setTimeout(tryScroll, 400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scrollToToday]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncOffset = () => {
      document.documentElement.style.setProperty(
        "--calendar-header-offset",
        `${el.offsetHeight}px`
      );
    };

    syncOffset();
    const observer = new ResizeObserver(syncOffset);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const openDaySheet = (dateKey: string, tab: DayTab = "mood") => {
    onOpenDay(dateKey, tab);
  };

  const handleDayClick = (dateKey: string) => {
    openDaySheet(dateKey, "mood");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-lg pb-28 lg:max-w-none">
        <header
          ref={headerRef}
          className="sticky top-0 z-10 border-b border-border/40 bg-background/75 px-4 py-4 backdrop-blur-xl sm:px-5 sm:py-5"
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={inboxOpen ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full lg:hidden"
              onClick={onToggleInbox}
              aria-label={inboxOpen ? "Hide notes" : "Show notes"}
              aria-pressed={inboxOpen}
            >
              <StickyNote className="h-3.5 w-3.5" />
            </Button>

            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
              <h1 className="text-center text-xl font-medium tracking-tight text-foreground">
                Mood
              </h1>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => scrollToToday("smooth")}
              >
                Today
              </Button>
              <ThemeToggle />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-[11px] text-muted-foreground"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
            </div>

            <Button
              type="button"
              variant={scheduleOpen ? "default" : "outline"}
              size="icon"
              className={cn("h-8 w-8 shrink-0 rounded-full lg:hidden")}
              onClick={onToggleSchedule}
              aria-label={scheduleOpen ? "Hide schedule" : "Show schedule"}
              aria-pressed={scheduleOpen}
            >
              <Calendar className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-0.5 text-center text-xs text-muted-foreground">
            Tap a day · scroll for more months
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
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

      <TodayQuickActions
        onOpenDay={(tab) => openDaySheet(toDateKey(new Date()), tab)}
      />
    </>
  );
}
