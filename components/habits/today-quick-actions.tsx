"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useHabits } from "@/lib/hooks/use-habits";
import { habitDisplayLabel } from "@/lib/habit-utils";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/date-utils";

export function TodayQuickActions() {
  const today = toDateKey(new Date());
  const { habits, logs, loading, toggleHabit } = useHabits(today);

  if (loading || habits.length === 0) return null;

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
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-sky-200 bg-sky-50 text-sky-800"
            : completed === false && kind === "vice"
              ? "border-rose-200 bg-rose-50/80 text-rose-700"
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
    <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Today — quick tap
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {habitItems.map((h) => renderChip(h.id, h.name, "habit"))}
        {viceItems.map((h) => renderChip(h.id, h.name, "vice"))}
      </div>
    </div>
  );
}
