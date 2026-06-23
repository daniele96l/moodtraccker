"use client";

import { type ReactNode, useState } from "react";
import {
  Archive,
  Check,
  Flame,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHabitLogs } from "@/lib/local-store";
import {
  getHabitStreak,
  habitDisplayLabel,
  HABIT_PRESETS,
  VICE_PRESETS,
} from "@/lib/habit-utils";
import type { Habit, HabitKind } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HabitListProps {
  dateKey: string;
  habits: Habit[];
  logs: Record<string, boolean>;
  onToggle: (habitId: string) => void;
  onAdd: (name: string, kind: HabitKind) => void;
  onMarkAllHabits: () => void;
  onMarkAllVices: () => void;
  onArchive: (habitId: string) => void;
  loading: boolean;
}

function StreakBadge({ count, kind }: { count: number; kind: HabitKind }) {
  if (count < 1) return null;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 border-0 text-[10px] font-medium",
        kind === "habit"
          ? "bg-emerald-100/80 text-emerald-700"
          : "bg-sky-100/80 text-sky-700"
      )}
    >
      <Flame className="h-3 w-3" />
      {count}d
    </Badge>
  );
}

function HabitRow({
  habit,
  dateKey,
  completed,
  onToggle,
  onArchive,
}: {
  habit: Habit;
  dateKey: string;
  completed: boolean | undefined;
  onToggle: () => void;
  onArchive: () => void;
}) {
  const streak = getHabitStreak(
    habit.id,
    habit.kind,
    getHabitLogs(habit.id),
    dateKey
  );
  const isHabit = habit.kind === "habit";
  const success =
    completed === undefined
      ? false
      : isHabit
        ? completed
        : completed;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all",
        success
          ? isHabit
            ? "border-emerald-200/80 bg-emerald-50/70"
            : "border-sky-200/80 bg-sky-50/70"
          : completed === false && !isHabit
            ? "border-rose-200/80 bg-rose-50/50"
            : "border-border/60 bg-card/80 hover:border-primary/20"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            success
              ? isHabit
                ? "border-emerald-400 bg-emerald-400 text-white"
                : "border-sky-400 bg-sky-400 text-white"
              : completed === false && !isHabit
                ? "border-rose-300 bg-rose-100 text-rose-500"
                : "border-muted-foreground/20 bg-background"
          )}
        >
          {success && <Check className="h-4 w-4" />}
          {completed === false && !isHabit && <X className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{habit.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {habitDisplayLabel(habit.kind, completed)}
          </p>
        </div>
        <StreakBadge count={streak} kind={habit.kind} />
      </button>
      <button
        type="button"
        onClick={onArchive}
        className="rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground group-hover:opacity-100"
        aria-label="Archive"
      >
        <Archive className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddPanel({
  kind,
  presets,
  onAdd,
  onClose,
}: {
  kind: HabitKind;
  presets: string[];
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-sm">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={kind === "habit" ? "New habit…" : "New vice to avoid…"}
        className="h-9 border-0 bg-muted/50 text-sm shadow-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) {
            onAdd(name.trim());
            setName("");
          }
        }}
      />
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onAdd(p)}
            className="rounded-full bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 flex-1"
          disabled={!name.trim()}
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim());
              setName("");
            }
          }}
        >
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  kind,
  items,
  dateKey,
  logs,
  onToggle,
  onArchive,
  onAdd,
  onQuickAction,
  quickLabel,
  accentClass,
}: {
  title: string;
  subtitle: string;
  kind: HabitKind;
  items: Habit[];
  dateKey: string;
  logs: Record<string, boolean>;
  onToggle: (id: string) => void;
  onArchive: (id: string) => void;
  onAdd: (name: string, kind: HabitKind) => void;
  onQuickAction: () => void;
  quickLabel: ReactNode;
  accentClass: string;
}) {
  const [adding, setAdding] = useState(false);
  const presets = kind === "habit" ? HABIT_PRESETS : VICE_PRESETS;

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={cn("text-sm font-medium", accentClass)}>{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {items.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 rounded-full border-dashed px-2.5 text-[11px]"
            onClick={onQuickAction}
          >
            {quickLabel}
          </Button>
        )}
      </div>

      {items.length === 0 && !adding ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          Nothing here yet
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              dateKey={dateKey}
              completed={logs[habit.id]}
              onToggle={() => onToggle(habit.id)}
              onArchive={() => onArchive(habit.id)}
            />
          ))}
        </div>
      )}

      {adding ? (
        <AddPanel
          kind={kind}
          presets={presets}
          onAdd={(n) => {
            onAdd(n, kind);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full rounded-xl text-xs text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add {kind}
        </Button>
      )}
    </section>
  );
}

export function HabitList({
  dateKey,
  habits,
  logs,
  onToggle,
  onAdd,
  onMarkAllHabits,
  onMarkAllVices,
  onArchive,
  loading,
}: HabitListProps) {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-5 w-5 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  const habitItems = habits.filter((h) => h.kind === "habit");
  const viceItems = habits.filter((h) => h.kind === "vice");

  return (
    <div className="space-y-6">
      <Section
        title="Habits"
        subtitle="Build streaks by completing these daily"
        kind="habit"
        items={habitItems}
        dateKey={dateKey}
        logs={logs}
        onToggle={onToggle}
        onArchive={onArchive}
        onAdd={onAdd}
        onQuickAction={onMarkAllHabits}
        quickLabel="All done"
        accentClass="text-emerald-700"
      />

      <div className="h-px bg-border/50" />

      <Section
        title="Vices"
        subtitle="Streak grows each day you avoid them"
        kind="vice"
        items={viceItems}
        dateKey={dateKey}
        logs={logs}
        onToggle={onToggle}
        onArchive={onArchive}
        onAdd={onAdd}
        onQuickAction={onMarkAllVices}
        quickLabel={
          <>
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            All avoided
          </>
        }
        accentClass="text-sky-700"
      />
    </div>
  );
}
