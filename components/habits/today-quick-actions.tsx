"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Flower2, ShieldCheck, Smile } from "lucide-react";
import { FooterNotes } from "@/components/global/footer-notes";
import { useHabits } from "@/lib/hooks/use-habits";
import { useDayEntry } from "@/lib/hooks/use-day-entry";
import { habitDisplayLabel } from "@/lib/habit-utils";
import {
  getDayEntry,
  getMeditationSessions,
  subscribeStore,
} from "@/lib/firestore-store";
import { moodColor, MOOD_LABELS } from "@/lib/mood-colors";
import { useTheme } from "@/lib/hooks/use-theme";
import type { DayTab } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/date-utils";

const QUICK_MOODS = [1, 3, 5, 7, 10] as const;

interface TodayQuickActionsProps {
  onOpenDay: (tab: DayTab) => void;
  className?: string;
}

export function TodayQuickActions({ onOpenDay, className }: TodayQuickActionsProps) {
  const today = toDateKey(new Date());
  const isDark = useTheme() === "dark";
  const { entry, upsert } = useDayEntry(today);
  const { habits, logs, loading, toggleHabit } = useHabits(today);
  const [hasJournal, setHasJournal] = useState(false);
  const [meditationCount, setMeditationCount] = useState(0);
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);

  const moodScore = entry?.mood_score ?? null;

  useEffect(() => {
    const refresh = () => {
      const entry = getDayEntry(today);
      setHasJournal(!!entry?.journal_text?.trim());
      setMeditationCount(getMeditationSessions(today).length);
    };
    refresh();
    return subscribeStore(refresh);
  }, [today]);

  const habitItems = habits.filter((h) => h.kind === "habit");
  const viceItems = habits.filter((h) => h.kind === "vice");

  const renderChip = (id: string, name: string, kind: "habit" | "vice") => {
    const completed = logs[id];
    const success =
      completed === undefined ? false : kind === "habit" ? completed : completed;
    const label = habitDisplayLabel(kind, completed);

    return (
      <button
        key={id}
        type="button"
        onClick={() => toggleHabit(id)}
        className={cn(
          "shrink-0 rounded-full border px-3 py-1.5 text-left transition-all active:scale-95",
          success
            ? kind === "habit"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
            : completed === false && kind === "vice"
              ? "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
              : "border-border/60 bg-card/90 text-muted-foreground hover:border-primary/30"
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-medium">
          {success ? (
            kind === "habit" ? (
              <Check className="h-3 w-3" />
            ) : (
              <ShieldCheck className="h-3 w-3" />
            )
          ) : null}
          {name}
        </span>
        <span className="block text-[10px] opacity-70">{label}</span>
      </button>
    );
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 z-20 w-full border-t border-border/40 bg-background/90 px-5 py-3 backdrop-blur-xl",
        "left-1/2 max-w-lg -translate-x-1/2",
        "lg:left-72 lg:right-72 lg:max-w-none lg:translate-x-0 xl:left-80 xl:right-80",
        className
      )}
    >
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Today — quick tap
      </p>

      {moodPickerOpen && (
        <div className="mb-3 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-sm">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            How&apos;s your day?
          </p>
          <div className="flex gap-1.5">
            {QUICK_MOODS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  upsert({ mood_score: n });
                  setMoodPickerOpen(false);
                }}
                className={cn(
                  "flex h-10 flex-1 flex-col items-center justify-center rounded-xl text-xs font-semibold tabular-nums transition-transform active:scale-95",
                  isDark ? "text-white/85" : "text-foreground/75",
                  moodScore === n && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: moodColor(n, isDark) }}
                aria-label={`Mood ${n}, ${MOOD_LABELS[n]}`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 w-full text-center text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMoodPickerOpen(false);
              onOpenDay("mood");
            }}
          >
            Fine-tune with slider
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="lg:hidden">
          <FooterNotes />
        </div>

        <button
          type="button"
          onClick={() => setMoodPickerOpen((v) => !v)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-left transition-all active:scale-95",
            moodScore != null
              ? "border-primary/30 text-foreground"
              : "border-border/60 bg-card/90 text-muted-foreground hover:border-primary/30"
          )}
          style={
            moodScore != null
              ? { backgroundColor: `${moodColor(moodScore, isDark)}66` }
              : undefined
          }
        >
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <Smile className="h-3 w-3 text-primary" />
            Mood
          </span>
          <span className="block text-[10px] opacity-70">
            {moodScore != null
              ? `${moodScore} · ${MOOD_LABELS[moodScore]}`
              : "Score today"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDay("meditate")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-left transition-all active:scale-95",
            meditationCount > 0
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border/60 bg-card/90 text-muted-foreground hover:border-primary/30"
          )}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium">
            {meditationCount > 0 && <Flower2 className="h-3 w-3 text-primary" />}
            Meditate
          </span>
          <span className="block text-[10px] opacity-70">
            {meditationCount > 0
              ? `${meditationCount} session${meditationCount > 1 ? "s" : ""}`
              : "Start today"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDay("journal")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-left transition-all active:scale-95",
            hasJournal
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border/60 bg-card/90 text-muted-foreground hover:border-primary/30"
          )}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium">
            {hasJournal && <BookOpen className="h-3 w-3 text-primary" />}
            Journal
          </span>
          <span className="block text-[10px] opacity-70">
            {hasJournal ? "Entry saved" : "Write today"}
          </span>
        </button>

        {!loading &&
          habitItems.map((h) => renderChip(h.id, h.name, "habit"))}
        {!loading && viceItems.map((h) => renderChip(h.id, h.name, "vice"))}
      </div>
    </div>
  );
}
