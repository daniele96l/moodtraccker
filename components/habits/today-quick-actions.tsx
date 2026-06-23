"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Flower2, ListTodo, ShieldCheck } from "lucide-react";
import { useDayTodos } from "@/lib/hooks/use-day-todos";
import { useHabits } from "@/lib/hooks/use-habits";
import { habitDisplayLabel } from "@/lib/habit-utils";
import {
  getDayEntry,
  getMeditationSessions,
  subscribeStore,
} from "@/lib/firestore-store";
import type { DayTab } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/date-utils";

interface TodayQuickActionsProps {
  onOpenDay: (tab: DayTab) => void;
}

export function TodayQuickActions({ onOpenDay }: TodayQuickActionsProps) {
  const today = toDateKey(new Date());
  const { habits, logs, loading, toggleHabit } = useHabits(today);
  const { todos, toggleTodo } = useDayTodos(today);
  const [hasJournal, setHasJournal] = useState(false);
  const [meditationCount, setMeditationCount] = useState(0);

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
    <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg -translate-x-1/2 border-t border-border/40 bg-background/90 px-5 py-3 backdrop-blur-xl">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Today — quick tap
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        <button
          type="button"
          onClick={() => onOpenDay("plan")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-left transition-all active:scale-95",
            todos.some((t) => !t.done)
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border/60 bg-card/90 text-muted-foreground hover:border-primary/30"
          )}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium">
            {todos.some((t) => !t.done) && (
              <ListTodo className="h-3 w-3 text-primary" />
            )}
            Plan
          </span>
          <span className="block text-[10px] opacity-70">
            {todos.filter((t) => !t.done).length > 0
              ? `${todos.filter((t) => !t.done).length} to do`
              : "Add tasks"}
          </span>
        </button>

        {todos
          .filter((t) => !t.done)
          .map((todo) => (
            <button
              key={todo.id}
              type="button"
              onClick={() => toggleTodo(todo.id)}
              className="max-w-[9rem] shrink-0 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-left transition-all active:scale-95 hover:border-primary/30"
            >
              <span className="block truncate text-xs font-medium">{todo.text}</span>
              <span className="block text-[10px] opacity-70">Tap to complete</span>
            </button>
          ))}

        {!loading &&
          habitItems.map((h) => renderChip(h.id, h.name, "habit"))}
        {!loading && viceItems.map((h) => renderChip(h.id, h.name, "vice"))}
      </div>
    </div>
  );
}
